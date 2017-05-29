var r = require('rethinkdb');

// Connect to the database.
var connection = null;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  if (err) throw err;
  connection = conn;
});

// Create a new entry in the campaign data.
createNode = function(name, type, parent) {
  if (parent == null) parent = "";

  return new Promise(function(resolve, reject) {
    r.db('campaign').table('data').insert([
      {
        type: type,
        name: name,
        parent: parent
      }
    ]).run(connection, function(err, result) {
      if (err) {
        reject(err);
      } else {
        var uuid = result.generated_keys[0];
        console.log('Created node ' + name + ' in database with uuid ' + uuid);

        resolve(uuid);
      }
    });
  });
};

// Delete a branch of the tree.
deleteNode = function(nodeId) {
  return new Promise(function(resolve, reject) {
    // If the nodeId is null, it means we'll end up deleting everything.
    // Don't allow this. There's a separate function for that.
    // Too much room for mistakes if we allow deleting the whole tree like this.

    // Delete all the children of this node.
    r.db('campaign').table('data').filter(r.row('parent').eq(nodeId)).run(connection).then(function(cursor) {
      // Create promises to delete all of the children.
      var promises = [];
      cursor.each(function(err, item) {
        promises.push(deleteNode(item.id));
      });

      return Promise.all(promises);

    // When that's done, we can delete ourselves.
    }).then(function(results) {
      return r.db('campaign').table('data').get(nodeId).delete().run(connection).then(function(result) {
        // All deleted..
        resolve();
      });
    }).catch(function(err) {
      reject(err);
    });
  });
}

// Delete the whole tree.
clearNodes = function() {
  return r.db('campaign').table('data').delete().run(connection);
};

getChildNodes = function(nodeId) {
  return new Promise(function(resolve, reject) {
    r.db('campaign').table('data').filter(r.row('parent').eq(nodeId)).run(connection).then(function(cursor) {
      var children = [];
      cursor.each(function(err, item) {
        children.push(item);
      });

      return children;
    }).then(function(children) {
      resolve(children);
    }).catch(function(err) {
      reject(err);
    });
  });
};

renameNode = function(nodeId, name) {
  return r.db('campaign').table('data').get(nodeId).update({ name: name }).run(connection);
}

// Call a function whenever a node changes.
observeNode = function(node, changed) {

}

// Called when a connection is made.
onConnect = function(io, socket) {
  console.log('a user connected');
}

// r.db('campaign').table('data').insert([
//   {
//
//   }
// ])

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

    // API calls.
    socket.on('createNode', function(name, type, parent, callback) {
      createNode(name, type, parent).then(callback);
    });

    socket.on('deleteNode', function(nodeId, callback) {
      deleteNode(nodeId).then(callback);
    });

    socket.on('clearNodes', function(callback) {
      clearNodes().then(callback);
    });

    socket.on('renameNode', function(nodeId, name, callback) {
      renameNode(nodeId, name).then(callback);
    });

    socket.on('getChildNodes', function(nodeId, callback) {
      getChildNodes(nodeId).then(callback);
    });

    // Send the client any changes that occur to the campaign data.
    r.db('campaign').table('data').pluck('id', 'name', 'type', 'parent').changes().run(connection).then(function(cursor) {
      cursor.each(function(err, result) {
        db_io.emit('nodeChanged', result);
      });
    });

  });
};
