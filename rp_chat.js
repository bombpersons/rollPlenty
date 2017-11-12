var slashCommand = require('slash-command');
var Roll = require('roll'),
    roll = new Roll();

// A list of commands.
var commands = {};
commands.roll = function(io, body) {
  // Get rid of any spaces in the body..
  // The dice roller doesn't like it.
  body = body.replace(/\s+/g, '');

  let result = roll.roll(body);
  io.emit('message', result.result);
};
commands.r = commands.roll;

// Run a pre-parsed command
runCommand = function(io, command, body) {
  if(commands.hasOwnProperty(command)) {
    commands[command](io, body);
  } else {
	io.emit('message', 'Invalid command');
  }
}

// Parse an incoming message to detect commands and macros
parseChat = function(io, msg) {
  let parsed = slashCommand(msg);
  if (parsed.command) {
    runCommand(io, parsed.command, parsed.body);
  } else {
    io.emit('message', msg);
  }
}

// Initialise chat io and direct messages to the parseChat function
exports.initialize = function(io) {
  let chat_io = io.of('/rp_chat');
  chat_io.on('connection', function(socket) {

    // Emit chat messages to all connected users.
    socket.on('message', function(msg) {
      parseChat(chat_io, msg);
    });
  });


}
