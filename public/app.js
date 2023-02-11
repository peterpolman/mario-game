// Class defines game rules
App = {
  uiWidth: 0,
  uiHeight: 0,
  speed: 100,
  canvas: document.getElementById('canvas'),
  players: [],
  cars: [],
  size: 20,
  socket: io(),

  // Initialize UI and configure player
  init: function () {
    // Set viewport dimensions]
    this.uiWidth = this.canvas.clientWidth;
    this.uiHeight = this.canvas.clientHeight;

    this.numBlocksVertical = Math.floor(this.uiHeight / this.size);
    this.numBlocksHorizontal = Math.floor(this.uiWidth / this.size);
    console.log(this);
    // Bind events to elements in UI and keyboard
    this.bindEvents();

    // Handle new players
    this.socket.on('player connected', function (socketId) {
      console.log('player connected: ' + socketId);

      player = App.createPlayer(socketId);
      // Render players
      App.players[socketId] = player;
      player.blocks.forEach((block) => {
        App.canvas.appendChild(block);
      });
    });

    // Handle disconnected players
    this.socket.on('player disconnected', function (socketId) {
      App.die(socketId);
    });

    this.socket.on('move player', function (msg) {
      App.move(msg[0], msg[1]);
    });

    App.spawnCoin();
    App.spawnCoin();
    App.spawnCoin();
    App.spawnCoin();
    App.spawnCoin();
    // Start the game when done
    return this.gameTimer();
  },
  die(playerId) {
    if (!App.players[playerId]) return;

    App.players[playerId].blocks.forEach((block) => {
      App.canvas.removeChild(block);
    })

    delete App.players[playerId];
    console.log('player disconnected: ' + playerId);
  },

  emitDirection: function (event) {
    App.socket.emit('move player', this.id);
    event.preventDefault();
  },

  move(player, direction) {
    if (
      (App.players[player].direction === 'left' && direction === 'right') ||
      (App.players[player].direction === 'up' && direction === 'down') ||
      (App.players[player].direction === 'right' && direction === 'left') ||
      (App.players[player].direction === 'down' && direction === 'up')
    ) return;
    App.players[player].direction = direction;
  },

  bindEvents: function () {
    // document.addEventListener('keydown', this.move );
    var btnDirection = document.getElementsByClassName('btnDirection');
    for (var i = 0; i < btnDirection.length; i++) {
      btnDirection[i].addEventListener('click', this.emitDirection);
    }
  },

  createCoin: function (x, y, radius) {
    var car = document.createElement('span');
    car.classList.add('car');

    car.x = x;
    car.y = y;
    car.radius = radius;

    car.style.left = car.x;
    car.style.top = car.y;

    return car;
  },

  // Helper method for player creation
  createPlayer() {
    const player = {
      color: Math.floor(Math.random() * 16777215).toString(16),
      blocks: [],
      direction: "right",
    }
    const startX = Math.round(this.numBlocksHorizontal / 2) * this.size;
    const startY = Math.round(this.numBlocksVertical / 2) * this.size;
    const positions = [[startX, startY], [startX + 20, startY]];

    for (const [x, y] of positions) {
      const block = this.newBlock(x, y);
      player.blocks.unshift(block);
    };

    return player;
  },

  newBlock: function (x, y, color) {
    var block = document.createElement('div');
    block.classList.add('player');

    block.x = x;
    block.y = y;
    block.radius = 15;

    block.style.left = block.x;
    block.style.top = block.y;
    block.style.backgroundColor = color;
    return block;
  },

  detectCollision: function (car, player) {
    var dx = (car.x + this.size / 2) - (player.x + this.size / 2);
    var dy = (car.y + this.size / 2) - (player.y + this.size / 2);
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < car.radius + player.radius / 2) {
      // collision detected!
      return true;
    }

  },

  updateSnakes() {
    for (const playerId in App.players) {
      const player = App.players[playerId];
      App.canvas.removeChild(player.blocks.pop());
    }
    const allBlocks = Object.values(App.players).length > 0 ? Object.values(App.players).map(({ blocks }) => blocks).reduce((a, b) => a.concat(b)) : [];

    playerloop:
    for (const playerId in App.players) {
      const player = App.players[playerId];
      const block = this.getNextBlock(player);

      for (const checkBlock of allBlocks) {
        if (checkBlock.y == block.y && checkBlock.x == block.x) {
          this.die(playerId);
          continue playerloop;
        }
      }

      player.blocks.unshift(block);
      App.canvas.appendChild(block);
    }
  },

  getNextBlock(player) {

    const block = this.newBlock(player.blocks[0].x, player.blocks[0].y, player.color);
    switch (player.direction) {
      case 'up': {
        block.y = block.y - this.size;
        break
      }
      case 'down': {
        block.y = block.y + this.size;
        break
      }
      case 'left': {
        block.x = block.x - this.size;
        break
      }
      case 'right': {
        block.x = block.x + this.size;
        break
      }
    }

    if (block.x <= 0) {
      block.x = this.uiWidth - 20;
    }
    else if (block.x > (this.numBlocksHorizontal) * 20) {
      block.x = 0;
    }

    if (block.y < 0) {
      block.y = this.numBlocksVertical * 20;
    }
    else if (block.y > this.numBlocksVertical * 20) {
      block.y = 0;
    }

    return block;
  },


  updateInterface: function () {
    for (id in App.players) {
      const player = App.players[id];

      for (const block of player.blocks) {
        // Detect for collision
        for (var i = 0; i < App.cars.length; i++) {
          var coin = App.cars[i];

          const coinCollision = App.detectCollision(coin, block);
          if (coinCollision) {
            // Remove from active list
            var index = App.cars.indexOf(coin);

            if (index > -1) {
              App.cars.splice(index, 1);
            }

            // Remove from DOM
            App.canvas.removeChild(coin);

            // Add block to player
            const block = this.newBlock(player.blocks[0].x, player.blocks[0].y, player.color);
            App.players[id].blocks.unshift(block);
            App.canvas.appendChild(block);

            App.spawnCoin();
            // Speed up
            // this.speed = this.speed - 10 > 10 ? this.speed - 10 : this.speed;
            // window.clearInterval(this.interval);
            // this.interval = window.setInterval(this.updateSnakes.bind(this), this.speed);
          }
        }
      }
    }
  },

  spawnCoin: function () {
    // if (App.cars.length === 1) return;
    var posX = Math.floor((Math.random() * App.uiWidth) + 1)
    var posY = Math.floor((Math.random() * App.uiHeight) + 1)

    // Render a car
    var coin = App.createCoin(posX, posY, 15);
    App.cars.push(coin);
    App.canvas.appendChild(coin);

    return true;
  },

  // Game timer fires events that randomly affect driving
  gameTimer() {
    this.interval = window.setInterval(this.updateSnakes.bind(this), this.speed);
    window.setInterval(this.updateInterface.bind(this), 100);
    // window.setInterval(this.spawnCoins, 1000);

    return true;
  }

}

window.onload = function () {
  App.init();
}
