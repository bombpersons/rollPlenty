var low = require('lowdb');
var db = low('db.json');

// Called when a connection is made.
onConnect = function(io, socket) {
  console.log('a user connected');

  db.set('maps.test_map', { icons: [], bg: 'image.png' })
    .write();

  console.log(JSON.stringify(db.getState(), null, 2));
}

// Called when the connection is disconnected.
onDisconnect = function() {
  console.log('a user disconnected');
}

exports.initialize = function(io, socket) {
  onConnect(io, socket);

  // Set up callbacks.
  socket.on('disconnect', onDisconnect);
};
