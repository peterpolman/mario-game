// Class defines game rules
Control = {
  socket: io(),
  color: Math.floor(Math.random() * 16777215).toString(16),
  isDeath: false,

  // Initialize UI and configure player
  init: function () {
    // Bind events to elements in UI and keyboard
    this.bindEvents();

    document.body.style.backgroundColor = this.color;

    this.socket.emit('player connected', this.color);

    var container = document.body;
    
    SwipeListener(container);
    
    container.addEventListener('swipe', function (e) {
      var directions = e.detail.directions;
      if (directions.left) {
        this.socket.emit('move player', 'left');
      }

      if (directions.right) {
        this.socket.emit('move player', 'right');
      }

      if (directions.top) {
        this.socket.emit('move player', 'up');
      }

      if (directions.bottom) {
        this.socket.emit('move player', 'down');
      }
    }.bind(this));

    this.socket.on('player dies', (playerId) => {
      if (this.socket.id === playerId) {
        let counter = 3;
        setInterval(() => {
          document.getElementById('controls').innerText = counter--;
          if (counter < 0) {
            window.location.reload()
          }
        }, 1000)
      }
    });
  },

  emitDirection: function (event) {
    this.socket.emit('move player', this.id);
    event.preventDefault();
  },

  move: function (event) {
    var keyName = event.key;

    if (keyName == 'ArrowLeft') {
      Control.socket.emit('move player', 'left');
    }

    if (keyName == 'ArrowRight') {
      Control.socket.emit('move player', 'right');
    }

    if (keyName == 'ArrowUp') {
      Control.socket.emit('move player', 'up');
    }

    if (keyName == 'ArrowDown') {
      Control.socket.emit('move player', 'down');
    }

  },

  bindEvents: function () {
    document.addEventListener('keydown', this.move);
    var btnDirection = document.getElementsByClassName('btnDirection');
    for (var i = 0; i < btnDirection.length; i++) {
      btnDirection[i].addEventListener('click', this.emitDirection);
    }
  }
}

window.onload = function () {
  Control.init();
}
