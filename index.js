var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/control', function(req, res){
  res.sendFile(__dirname + '/control.html');
});

io.on('connection', function(socket){

  io.emit('player connected', socket.id);
  console.log('player connected: ' + socket.id);

  socket.on('move player', function(direction){
    var msg = [socket.id, direction];
    io.emit('move player', msg);
  });

  socket.on('disconnect', function(){
    io.emit('player disconnected', socket.id);
    console.log('player disconnected: ' + socket.id);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
