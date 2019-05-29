import $ from 'jquery'
const qr = require('qrcode')

const mainPage = $('#mainPage')
const startPlay = $('#startPlay')
const winEl = $('#win')
const playEl = $('#play')

const buttons = {
  startPlay: $('#startGame')
}

const qrCanvas = document.getElementById('connectQr')

let state = {
  menu: 'main',
  ws: null
}


startPlay.hide();
winEl.hide();
playEl.hide();

if (location.hash.length > 8) {

  mainPage.hide()

  state.room = /connectId\=([a-zA-Z0-9]*)/.exec(location.hash)[1]
  state.menu = 'game';
  console.log(state.room);
  state.role = 'slave'
  state.ws = new WebSocket('ws://' + location.host)


  state.ws.onmessage = parseMsg
  state.ws.onopen = function () {
    state.ws.send(JSON.stringify({
      'type': 'connect',
      'room': state.room,
      'role': 'slave'
    }))
  }

}

window.a = state;

const canvas = document.getElementById('field')
function drawLine(ctx, x, y, tx, ty) {
  ctx.beginPath();
  ctx.moveTo(x, y)
  ctx.lineTo(tx, ty)
  ctx.stroke()
}

function drawArc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
}

function render(f) {
  if (!f.field) return;
  canvas.width = f.size * 48;
  canvas.height = f.size * 48 + 48;
  const ctx = canvas.getContext('2d')
  f.field.forEach((e, x) => {
    e.forEach((c, y) => {
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 1;
      ctx.strokeRect(x * 48, y * 48, 48, 48)
      ctx.strokeStyle = c == f.player ? 'green' : 'red'
      ctx.lineWidth = 2;
      if (c == 'x') {
        drawLine(ctx, x * 48 + 8, y * 48 + 8, x * 48 + 40, y * 48 + 40)

        drawLine(ctx, x * 48 + 40, y * 48 + 8, x * 48 + 8, y * 48 + 40)
      } else if (c == 'o') {
        drawArc(ctx, x * 48 + 24, y * 48 + 24, 16)
      }
    })
  })
  ctx.font = "32px Comic Sans MS";
  ctx.textAlign = "center";
  if (!f.win) {
    ctx.fillStyle = f.turn == f.player ? 'green' : 'red';

    ctx.fillText(f.turn == f.player ? 'Your`s turn' : 'Opponents turn',
      canvas.width / 2, canvas.height - 15
    );
  } else {
    ctx.fillStyle = f.win.win == f.player ? 'green' : 'red';

    ctx.strokeStyle = f.win.win == f.player ? 'green' : 'red';
    ctx.lineWidth = 3;
    drawLine(ctx, f.win.line[0] * 48 + 23,
      f.win.line[1] * 48 + 23, f.win.line[2] * 48 + 23, f.win.line[3] * 48 + 23)

    ctx.fillText(f.win.win == f.player ? 'You win' : 'Opponent win',
      canvas.width / 2, canvas.height - 15
    );
  }
}

function changeClick(cl) {
  canvas.onclick = function (e) {
    let { x: canvasX, y: canvasY } = canvas.getBoundingClientRect()
    let x = Math.floor((e.clientX - canvasX) / 48);
    let y = Math.floor((e.clientY - canvasY) / 48);
    cl(x,y)
  }
}

function startGame() {
  console.log('Game start')
  startPlay.hide();
  winEl.hide();
  playEl.show();
  mainPage.hide();

  changeClick(function (x, y) {
    state.ws.send(JSON.stringify({
      type: 'putFigure',
      pos: {
        x,y
      }
    }))
  })
}

function endGame(winner) {
  console.log('endGame', winner)
  startPlay.hide()
  mainPage.hide()
  winEl.show()
  playEl.hide()

  winEl.css('color', state.role == winner ? 'green' : 'red')
  winEl.text(state.role == winner ? 'You win' : 'You lose')
}

function parseMsg(msgR) {
  let msg = JSON.parse(msgR.data);
  console.log(msg)
  if (msg.type == 'error') console.error(msg.error)
  if (msg.type == 'endGame') endGame(msg.winner)
  if (msg.type == 'startGame') startGame()

  if (msg.type = 'render') render(msg)
}


buttons.startPlay.click(function () {
  state.menu = 'creatingGame';
  mainPage.hide()
  startPlay.hide();
  winEl.hide();
  playEl.hide();
  fetch('/createRoom', {
    method: 'post'
  }).then(res => res.text()).then(id => {
    console.log(id)
    qr.toCanvas(qrCanvas, location.host + '/#connectId=' + id)
    state.ws = new WebSocket('ws://' + location.host)
    state.room = id
    state.role = 'master'
    state.ws.onmessage = parseMsg
    state.ws.onopen = function () {
      state.ws.send(JSON.stringify({
        'type': 'connect',
        'room': state.room,
        'role': 'master'
      }))
      startPlay.show()
    }

  });

})