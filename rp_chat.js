exports.initialize = function(io, socket) {
  // Emit chat messages to all connected users.
  socket.on('chat message', function(msg) {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
}
