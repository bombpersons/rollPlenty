var slashCommand = require('slash-command');
var Roll = require('roll'),
    roll = new Roll();
var RollSW = require('./rollSW'),
	rollSW = new RollSW();

// ---	
// Setup commands.
// ---
var commands = {};

// Standard d20 system rolls
commands.roll = function(io, body) {
  // Get rid of any spaces in the body..
  // The dice roller doesn't like it.
  body = body.replace(/\s+/g, '');

  // Wrap roll module call in error handling - 
  // TODO: ideally we should pull this out into something more reusable
  try {
    let result = roll.roll(body);
    io.emit('message', result.result);
  } catch (e) {
	  if(e instanceof Roll.InvalidInputError)
	  {
		  io.emit('message', "Invalid input: " + body);
	  } else {
		  throw e;
	  }
  }
};
commands.r = commands.roll;

// SW:EotE system rolls
commands.rollsw = function(io, body) {
	let result = rollSW.roll(body);
	io.emit('message', result.result);
};
commands.rsw = commands.rollsw;

// ---
// End of commands
// ---


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
