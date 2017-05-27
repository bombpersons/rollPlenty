exports.initialize = function(io) {
  var chat_io = io.of('/rp_chat');
  chat_io.on('connection', function(socket) {

    // Emit chat messages to all connected users.
    socket.on('message', function(msg) {
      console.log('message: ' + msg);
      io.emit('message', msg);
    });

  });


}
