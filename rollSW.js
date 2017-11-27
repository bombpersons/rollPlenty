(function () {
  'use strict';

  var util = require('util');
  var regex = /^(\d+)([aApPdDcCbBsSfF])\s*((\s*(\d+)([aApPdDcCbBsSfF]))*)$/

  // Crappy enum-like thing - look to implementing something nicer if we use enums a lot
  // Alternatively, use something like this: https://github.com/vivin/enumjs/blob/master/src/enum.js
  var DieKeys = Object.freeze({
    ABILITY : 'a',
    PROFICIENCY : 'p',
    DIFFICULTY : 'd',
    CHALLENGE : 'c',
    BOOST : 'b',
    SETBACK : 's',
    FORCE: 'f'
  });

  function InvalidInputError(input) {
    this.name = 'InvalidInputError';
    if (input) {
      this.message = util.format('"%s" is not a valid input string for rollSW.', input);
    } else {
      this.message = 'No input string was supplied for rollSW.';
    }
    this.input = input;
  }

  InvalidInputError.prototype = new Error();
  InvalidInputError.prototype.constructor = InvalidInputError;

  // Define constructor
  var roll;
  roll = function (random) {
	// Create or take existing binding to Math.random
    this.random = random || Math.random.bind(Math);
  };

  // Define functions
  roll.prototype.validate = function(s) {
    return regex.test(s);
  }

  roll.prototype.parse = function(s, dieBag) {
    if (!this.validate(s)) {
      throw new InvalidInputError(s);
    }

    if (dieBag === undefined) {
      dieBag = {
        [DieKeys.ABILITY] : 0,
        [DieKeys.PROFICIENCY] : 0,
        [DieKeys.DIFFICULTY] : 0,
        [DieKeys.CHALLENGE] : 0,
        [DieKeys.BOOST] : 0,
        [DieKeys.SETBACK] : 0,
        [DieKeys.FORCE] : 0
      }
    }

    var match = regex.exec(s);

    // Get the details of each die to roll in turn, reparsing the leftover string
    var quantity = parseInt(match[1]);    // 3a1p => 3
    var die = match[2].toLowerCase();     // 3a1p => a
    var remainingInput = match[3];        // 3a1p => 1p

    if (dieBag[die] !== undefined) {
      dieBag[die] += quantity;
    } else {
      throw "Unhandled die type: '" + die + "'";
    }

    if (remainingInput)
    {
      dieBag = this.parse(remainingInput, dieBag);
    }
    return dieBag;
  }

  roll.prototype.roll = function(input) {
    var dieBag;
    if (!input) {
      throw new InvalidInputError();
    } else  if (typeof input === 'string') {
       dieBag = this.parse(input);
    }

    // TODO: Actually roll the die and produce a proper result string rather than this.
    var resultStr = "";
    Object.keys(dieBag).forEach(function(key,index) {
      resultStr += key + ": " + dieBag[key] + "\t";
    });

	  return {
      input : input,
      dieBag : dieBag,
	    result: resultStr
    };
  };

  module.exports = roll;
  module.exports.InvalidInputError = InvalidInputError;

}());
