var r = require('rethinkdb');

var connection = null;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  if (err) throw err;

  r.dbCreate('campaign').run(conn, function(err, result) {
    if (err) throw err;

    // Create the data table to store the campaigns data.
    r.db('campaign').tableCreate('data').run(conn, function(err, result) {
      if (err) throw err;
    });
  });

});
