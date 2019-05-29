class Game {
  constructor(size, match) {
    this.field = new Array(size).fill(0)
      .map(e => new Array(size).fill('_'))
    this.match = match
    this.turn = 'x'
    this.size = size;
  }

  log() {
    console.log(
      this.field.map(e => e.join('  ')).join('\n')
    )
  }

  putData(x, y) {
    if (this.field[x][y] != '_') return false;
    this.field[x][y] = this.turn
    if (this.testForWin(x, y, this.turn)) {
      return true
    }
    this.turn = ({ 'x': 'o', 'o': 'x' })[this.turn]

    for (let x = 0; x < this.field.length; x++)
      for (let y = 0; x < this.field[x].length; x++)
        if (this.field[x][y] == '_')
          return false;
    return true;

  }

  testForWin(x, y, symbol) {
    return this.testForWinHorizontal(x, y, symbol) ||
      this.testForWinVertical(x, y, symbol) ||
      this.testForWinDiagonal1(x, y, symbol) ||
      this.testForWinDiagonal2(x, y, symbol)

  }

  testForWinVertical(x, y, symbol) {
    while (this.field[x][y - 1] == symbol)
      y--;
    let rep = 1;
    while (this.field[x][y + 1] == symbol) {
      y++;
      rep++
    }
    return rep >= this.match
  }


  testForWinHorizontal(x, y, symbol) {
    while (x > 0 && this.field[x - 1][y] == symbol)
      x--;
    let rep = 1;
    while (x < this.size - 1 && this.field[x + 1][y] == symbol) {
      x++;
      rep++
    }
    return rep >= this.match
  }

  testForWinDiagonal1(x, y, symbol) {
    while (x > 0 && this.field[x - 1][y - 1] == symbol) {
      x--;
      y--
    }
    let rep = 1;
    while (x < this.size - 1 && this.field[x + 1][y + 1] == symbol) {
      x++;
      y++
      rep++
    }
    return rep >= this.match
  }
  testForWinDiagonal2(x, y, symbol) {
    while (x > 0 && this.field[x - 1][y + 1] == symbol) {
      x--;
      y++
    }
    let rep = 1;
    while (x < this.size - 1 && this.field[x + 1][y - 1] == symbol) {
      x++;
      y--;
      rep++
    }
    return rep >= this.match
  }

  genField() {
    return JSON.parse(JSON.stringify(this.field))
  }


}

module.exports = Game