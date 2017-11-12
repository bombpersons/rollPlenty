(function () {
  'use strict';
  
  // Define constructor
  var roll;
  roll = function (random) {
	// Create or take existing binding to Math.random
    this.random = random || Math.random.bind(Math);
  };
  
  // Define functions
  roll.prototype.roll = function(input) {
	return {
      input : input,
	  result: "Success!"
	};
  };
	
  module.exports = roll;
  
}());
