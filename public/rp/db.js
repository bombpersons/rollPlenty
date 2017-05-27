$(function () {
  var socket = io('/rp_db');

  socket.emit('dumpDB', function(dump) {
    $('#tree').text(JSON.stringify(dump, null, 2));
  });

});
