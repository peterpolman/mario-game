// Class defines game rules
App = {
  uiWidth: 0,
  uiHeight: 0,
  speed: 10,
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
      App.canvas.appendChild(App.players[msg]);
      console.log(App.players);
    });

    // Handle disconnected players
    this.socket.on('player disconnected', function(msg){
      App.canvas.removeChild(App.players[msg]);
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
    if (direction == 'left') {
      var int = App.players[player].x = App.players[player].x - (1 * App.speed);
      App.players[player].style.left = int <= 0 ? 0 : int;
      App.players[player].style['background-position'] = '-135px -90px';
      App.players[player].style['transform'] = 'scaleX(-1)';
    }

    if (direction == 'right') {
      var int = App.players[player].x = App.players[player].x + (1 * App.speed);
      App.players[player].style.left = int >= App.uiWidth ? App.uiWidth : int;
      App.players[player].style['transform'] = 'scaleX(1)';
      App.players[player].style['background-position'] = '-135px -90px';
    }

    if (direction == 'up') {
      var int = App.players[player].y = App.players[player].y - (1 * App.speed);
      App.players[player].style.top = int <= 0 ? 0 : int;
      App.players[player].style['background-position'] = '-72px -172px';
    }

    if (direction == 'down') {
      var int = App.players[player].y = App.players[player].y + (1 * App.speed);
      App.players[player].style.top = int >= App.uiHeight ? App.uiHeight : int;
      App.players[player].style['background-position'] = '-72px -10px';
    }
  },

  bindEvents: function() {
    // document.addEventListener('keydown', this.move );
    var btnDirection = document.getElementsByClassName('btnDirection');
    for (var i = 0; i < btnDirection.length; i++) {
      btnDirection[i].addEventListener('click', this.emitDirection);
    }
  },

  // Helper method for obstacle creation
  createCoin: function() {
    var coin = document.createElement('div');
    coin.classList.add = 'coin';
    this.canvas.appendChild(coin)

    return coin;
  },

  // Helper method for car creation
  createCar: function(x, y, radius) {
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
  createPlayer: function() {
    var player = document.createElement('div');
    player.classList.add('player');

    player.x = this.uiWidth / 2;
    player.y = this.uiHeight / 2;
    player.radius = 15;

    player.style.left = player.x;
    player.style.top = player.y;

    return player;
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

  updateInterface: function() {
    for (var i = 0; i < App.cars.length; i++) {
      var car = App.cars[i];

      // Move the car over Y
      car.style.top = car.y = car.y + 10;

      for(id in App.players){
        // Detect for collision
        var collision = App.detectCollision(car, App.players[id]);

        if (collision) {
          // Remove from active list
          var index = App.cars.indexOf(car);

          if (index > -1) {
            App.cars.splice(index, 1);
          }

          // Remove from DOM
          App.canvas.removeChild(car);
        }
        else if (!collision && car.style.top >= App.uiHeight) {
          // Remove car if out of bound
          App.canvas.removeChild(car);
        }
      }
    }
  },

  spawnCars: function() {
    var posX = Math.floor((Math.random() * App.uiWidth) + 1)

    // Render a car
    var car = App.createCar(posX, 0, 15);
    App.cars.push(car);
    App.canvas.appendChild(car);

    return true;
  },

  // Game timer fires events that randomly affect driving
  gameTimer: function () {
    window.setInterval(this.updateInterface, 100);
    window.setInterval(this.createCoin, 3000);
    window.setInterval(this.spawnCars, 2000);

    return true;
  }

}

window.onload = function() {
  App.init();
}
