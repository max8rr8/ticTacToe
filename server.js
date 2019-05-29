const express = require('express');
const http = require('http');
const WebSocket = require('ws').Server;
const Game = require('./game')

const app = express()
const server = http.createServer(app)
const ws = new WebSocket({ server })

let rooms = {};

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function render(room) {
  const ro = rooms[room]
  const field = ro.field.genField()
  ro.master.send(JSON.stringify({
    type: 'render',
    player: ro.xfigure == 'master' ? 'x' : 'o',
    turn: ro.field.turn,
    size: ro.field.size,
    field
  }))

  ro.slave.send(JSON.stringify({
    type: 'render',
    player: ro.xfigure == 'master' ? 'o' : 'x',
    turn: ro.field.turn,
    size: ro.field.size,
    field
  }))
}

function sendError(socket, err, code) {
  socket.send(JSON.stringify({ 'type': 'error', 'error': err, 'code': code }))
}

function endGame(room, winner) {
  rooms[room].state = 'endGame'
  //console.log(room + ' endGame')
  try {
    rooms[room].slave.send(JSON.stringify({
      'type': 'endGame',
      'winner': winner
    }))
    rooms[room].slave.terminate()
  } catch (e) { }

  try {
    rooms[room].master.send(JSON.stringify({
      'type': 'endGame',
      'winner': winner
    }))
    rooms[room].master.terminate()
  } catch (e) { }
  setTimeout(() => {

    rooms[room] = null;
  }, 1000)
}

function startGame(roomId) {
  room = rooms[roomId]
  room.field = new Game(7, 5)
  room.xfigure = Math.random() >= 0.5 ? 'master' : 'slave'
  room.master.send(JSON.stringify({
    'type': 'startGame',
  }))
  room.slave.send(JSON.stringify({
    'type': 'startGame',
  }))

  room.master.on('message', function (msg) {
    msg = JSON.parse(msg)
    //console.log(msg)
    if (msg.type == 'putFigure') {
      if (room.field.turn == (room.xfigure == 'master' ? 'x' : 'o')) {
        //console.log('new turn ', msg.pos.x, msg.pos.y)
        if (room.field.putData(msg.pos.x, msg.pos.y)) {
          endGame(roomId, 'master')
        } else {
          render(roomId)
        }
      }
    }
  })

  room.slave.on('message', function (msg) {
    msg = JSON.parse(msg)
    //console.log(msg)
    if (msg.type == 'putFigure') {
      if (room.field.turn == (room.xfigure == 'master' ? 'o' : 'x')) {
        //console.log('new turn ', msg.pos.x, msg.pos.y)
        if (room.field.putData(msg.pos.x, msg.pos.y)) {

          endGame(roomId, 'slave')
        } else {
          render(roomId)
        }
      }
    }
  })

  render(roomId);
}

ws.on('connection', function (socket) {
  try {
    let room = '';
    let role = '';
    socket.on('message', (msg) => {
      try {
        msg = JSON.parse(msg)
        //console.log(msg)
        if (msg.type == 'connect') {
          if (!rooms[msg.room]) return sendError(socket, 'Room not found', 0x20)
          if (rooms[msg.room].state !== 'waiting') return sendError(socket, 'Game not waiting you', 0x2)
          if (msg.role != 'slave' && msg.role != 'master') return sendError(socket, 'Uncorrect role', 0x21)
          if (rooms[msg.room][msg.role]) return sendError(socket, 'Role is in use', 0x22)

          room = msg.room;
          role = msg.role;
          rooms[msg.room][msg.role] = socket;
          //console.log(role + ' connected to: ' + room)

          if (msg.role == 'slave') startGame(room);

          socket.on('close', function () {
            //console.log(role + ' disconnected')
            if (room.state == 'endGame') return;
            if (role == 'slave') endGame(room, 'master')
            if (role == 'master') endGame(room, 'slave')
          })
        }
      } catch (e) { }

    })
  } catch (e) { }
})

app.use(express.static('dist'))

app.get('/', function (req, res) {
  res.sendFile('dist/index.html')
})

app.post('/createRoom', function (req, res) {
  let id = makeid(8)
  //console.log('Created room: ' + id)
  rooms[id] = {
    state: 'waiting'
  }
  res.end(id);
})

server.listen(8000)