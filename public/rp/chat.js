$(function () {
  var socket = io('/rp_chat');

  // Chat
  $('#chat_box_form').submit(function(){
    socket.emit('message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
});
