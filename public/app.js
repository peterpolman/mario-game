// Class defines game rules
App = {
  uiWidth: 0,
  uiHeight: 0,
  speed: 100,
  canvas: document.getElementById('canvas'),
  players: [],
  cars: [],
  socket: io(),

  // Initialize UI and configure player
  init: function() {
    // Set viewport dimensions]
    this.uiWidth = this.canvas.clientWidth;
    this.uiHeight = this.canvas.clientHeight;

    // Bind events to elements in UI and keyboard
    this.bindEvents();

    // Handle new players
    this.socket.on('player connected', function(msg){
      console.log('player disconnected: ' + msg);

      // Render players
      App.players[msg] = App.createPlayer();
      App.players[msg].blocks.forEach((block) => {
        App.canvas.appendChild(block);
      });
    });

    // Handle disconnected players
    this.socket.on('player disconnected', function(msg){
      if (!App.players[msg]) return;

      App.players[msg].blocks.forEach((block) => {
        App.canvas.removeChild(block);
      })
      
      App.players.splice(msg, 1);
      console.log('player disconnected: ' + msg);
    });

    this.socket.on('move player', function(msg){
      App.move(msg[0], msg[1]);
    });

    // Start the game when done
    return this.gameTimer();
  },

  emitDirection: function(event) {
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

  bindEvents: function() {
    // document.addEventListener('keydown', this.move );
    var btnDirection = document.getElementsByClassName('btnDirection');
    for (var i = 0; i < btnDirection.length; i++) {
      btnDirection[i].addEventListener('click', this.emitDirection);
    }
  },

  createCoin: function(x, y, radius) {
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
      color: Math.floor(Math.random()*16777215).toString(16),
      blocks: []
    }
    const startX = this.uiWidth / 2;
    const startY = this.uiHeight / 2;
    const positions = [[startX, startY], [startX + 20, startY]];

    for (const [x,y] of positions) {
      const block = this.addBlock(x, y);
      player.blocks.unshift(block);
    };

    return player;
  },

  addBlock: function(x, y, color) {
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
    var dx = car.x - player.x;
    var dy = car.y - player.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < car.radius + player.radius) {
      // collision detected!
      return true;
    }

  },
  
  updateSnakes() {
    for (const playerId in App.players) {
      const player = App.players[playerId];
      const distance = 20;
      const block = this.addBlock(player.blocks[0].x, player.blocks[0].y, player.color);
      
      switch(player.direction) {
        case 'up': {
          block.style.top = block.y = block.y - distance;
          break
        }
        case 'down': {
          block.style.top = block.y = block.y + distance;
          break
        }
        case 'left':{
          block.style.left = block.x = block.x - distance;
          break
        }
        case 'right':{
          block.style.left = block.x = block.x + distance;
          break
        }
      }

      player.blocks.unshift(block);
      App.canvas.appendChild(block);
      App.canvas.removeChild(player.blocks.pop());
    }
  },

  updateInterface: function() {
    for(id in App.players){
      const player = App.players[id];

      for (var i = 0; i < App.cars.length; i++) {
        var coin = App.cars[i];
    
        // Detect for collision
        for (const block of player.blocks) {
          
          let otherBlocks = []
          for (const playerId in App.players) {
            if (id !== playerId) {
              const player = App.players[playerId];
              otherBlocks = otherBlocks.concat(player.blocks);  
            }
          }

          for (const b of otherBlocks) {
            const playerCollision = App.detectCollision(b, block);
            if (playerCollision) {
              debugger
            }
          }

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
            const block = this.addBlock(player.blocks[0].x, player.blocks[0].y, player.color);
            App.players[id].blocks.unshift(block);
            App.canvas.appendChild(block);
            
            // Speed up
            this.speed = this.speed - 10 > 10 ? this.speed - 10 : this.speed;
            window.clearInterval(this.interval);
            this.interval = window.setInterval(this.updateSnakes.bind(this), this.speed);
          }
          
          if (
            block.style.top >= App.uiHeight ||
            block.style.top < 0 ||
            block.style.left >= App.uiWidth ||
            block.style.left < 0
          ) {
            debugger
            // App.canvas.removeChild(block);
          }
        }
      }
    }
  },

  spawnCoins: function() {
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
    window.setInterval(this.spawnCoins, 1000);

    return true;
  }

}

window.onload = function() {
  App.init();
}
