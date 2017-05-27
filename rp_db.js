var low = require('lowdb');
var db = low('db.json');

// Called when a connection is made.
onConnect = function(io, socket) {
  console.log('a user connected');

  db.set('root.maps.test_map', { type: 'map', icons: [], bg: 'image.png' })
    .write();

  db.set('root.characters.test_char', { type: 'character', stats: {} })
    .write();

  console.log(JSON.stringify(db.getState(), null, 2));
}

// Called when the connection is disconnected.
onDisconnect = function() {
  console.log('a user disconnected');
}

exports.initialize = function(io) {
  var db_io = io.of('/rp_db');
  db_io.on('connection', function(socket) {
    // We just connected to something.
    onConnect(db_io, socket);

    // Set up callbacks.
    socket.on('disconnect', onDisconnect);

    // Request the database tree.
    socket.on('dumpDB', function(callback) {
      callback(db.getState());
    });
  });
};
