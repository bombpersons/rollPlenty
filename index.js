var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

// This the db connection we use to sync with the client.
var rp_db = require('./rp_db.js');

// This handles the chat functionality, including the
// dice roll macros.
var rp_chat = require('./rp_chat.js');

// Port to use.
app.set('port', (process.env.PORT || 5000));

// Serve files from public as static files.
app.use(express.static('public'));

// Serve index.html as the main page.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Deal with a new connection.
rp_db.initialize(io);
rp_chat.initialize(io);

// Begin listening and serving pages.
http.listen(app.get('port'), function() {
  console.log('listening on *:', app.get('port'));
});
