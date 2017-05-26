var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

// Port to use.
app.set('port', (process.env.PORT || 5000));

// Serve files from public as static files.
app.use(express.static('public'));

// Serve index.html as the main page.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Deal with a new connection.
io.on('connection', function(socket) {
  console.log('a user connected');

  // Set up callbacks.
  socket.on('disconnect', function() {
    console.log('a user disconnected');
  })

  // Emit chat messages to all connected users.
  socket.on('chat message', function(msg) {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

});

// Begin listening and serving pages.
http.listen(app.get('port'), function() {
  console.log('listening on *:', app.get('port'));
});
