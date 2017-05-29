$(function () {
  var socket = io('/rp_db');

  // Icons for the tree view.
  glyph_opts = {
    map: {
      doc: "glyphicon glyphicon-file",
      docOpen: "glyphicon glyphicon-file",
      checkbox: "glyphicon glyphicon-unchecked",
      checkboxSelected: "glyphicon glyphicon-check",
      checkboxUnknown: "glyphicon glyphicon-share",
      dragHelper: "glyphicon glyphicon-play",
      dropMarker: "glyphicon glyphicon-arrow-right",
      error: "glyphicon glyphicon-warning-sign",
      expanderClosed: "glyphicon glyphicon-menu-right",
      expanderLazy: "glyphicon glyphicon-menu-right",  // glyphicon-plus-sign
      expanderOpen: "glyphicon glyphicon-menu-down",  // glyphicon-collapse-down
      folder: "glyphicon glyphicon-folder-close",
      folderOpen: "glyphicon glyphicon-folder-open",
      loading: "glyphicon glyphicon-refresh glyphicon-spin"
    }
  };

  // Initialize fancy tree.
  $('#tree').fancytree({
    source: [
      {title: "Root", lazy: true, type: "directory", folder: true, key: ""},
    ],

    // Only load the contents of a node when it's expanded.
    lazyLoad: function(event, data) {
      var node = data.node;

      // Get any children of this node from the server if we can.
      data.result = new Promise(function(resolve, reject) {
        socket.emit('getChildNodes', node.key, function(dump) {
          var results = [];

          // Process the data into the form fancytree wants.
          var length = dump.length;
          for (var i = 0; i < length; i++) {
            var item = dump[i];
            results.push({
              title: item.name,
              key: item.id,
              lazy: true,

              type: item.type
            });
          }

          resolve(results);
        });
      });
    },

    // Context menu.
    contextMenu: {
      menu: function(node) {
        var items = {};

        // Don't show the new file and folder for non-folders.
        if (node.data.type === "directory") {
          items.newFile = { "name": "New File", "icon": "new" };
          items.newDir = { "name": "New Folder", "icon": "new" };
        }

        items.delete = { "name": "Delete", "icon": "delete" };
        return items;
      },
      actions: {
        newFile: function(node, options) {
          console.log(node);
          socket.emit('createNode', 'New File', 'custom_type', node.key, function(nodeId) {

          });
        },
        newDir: function(node, options) {
          socket.emit('createNode', 'New Folder', 'directory', node.key, function(nodeId) {

          });
        },
        delete: function(node, options) {
          socket.emit('deleteNode', node.key, function() {
          });
        }
      }
    },

    // Inline editing (renaming).
    edit: {
      // Available options with their default:
      adjustWidthOfs: 4,   // null: don't adjust input size to content
      inputCss: { minWidth: "3em" },
      triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
      beforeEdit: $.noop,  // Return false to prevent edit mode
      edit: $.noop,        // Editor was opened (available as data.input)
      beforeClose: $.noop, // Return false to prevent cancel/save (data.input is available)
      save: function(event, data) { // Save data.input.val() or return false to keep editor open
        var node = data.node;
        var input = data.input.val();

        // Try and rename the node on the server.
        socket.emit('renameNode', node.key, input, function() {
          node.setTitle(input);
        });
      },
      close: $.noop,       // Editor was removed
    },

    extensions: ["dnd", "edit", "glyph", "wide", "contextMenu"],
    checkbox: true,
    dnd: {
      autoExpandMS: 400,
      focusOnClick: true,
      preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
      preventRecursiveMoves: true, // Prevent dropping nodes on own descendants

      dragStart: function(node, data) { return true; },
      dragEnter: function(node, data) { return false; },
      dragDrop: function(node, data) { data.otherNode.copyTo(node, data.hitMode); }
    },
    glyph: glyph_opts,
    selectMode: 2,
    toggleEffect: { effect: "drop", options: {direction: "left"}, duration: 400 },
    wide: {
      iconWidth: "1em",       // Adjust this if @fancy-icon-width != "16px"
      iconSpacing: "0.5em",   // Adjust this if @fancy-icon-spacing != "3px"
      labelSpacing: "0.1em",  // Adjust this if padding between icon and label != "3px"
      levelOfs: "1.5em"       // Adjust this if ul padding != "16px"
    }
  });
  var tree = $('#tree').fancytree("getTree");

  $('#clear_db').click(function() {
    socket.emit('clearNodes', function() {
      console.log("DELETED EVERYTHING!");
    });
  });

  $('#add_test').click(function() {
    socket.emit('createNode', 'custom_name', 'custom_type', null, function(nodeId) {
    });
  });

  $('#update').click(function() {
    tree.reload();
  });

  // Listen to any changes to the tree.
  socket.on('nodeChanged', function(result) {
    // Check if the node was deleted.
    if (result.new_val == null) {
      // Okay the node was deleted, so find the node and delete it.
      var node = tree.getNodeByKey(result.old_val.id);
      if (node) {
        node.remove();
      }

      // Simple =)
      return;
    }

    // A node was change on the server. Find the node that represents it.
    var nodeInfo = { lazy: true, title: result.new_val.name, key: result.new_val.id, type: result.new_val.type };
    if (result.new_val.type === "directory") {
      nodeInfo.folder = true;
    }

    var node = tree.getNodeByKey(result.new_val.id);
    if (!node) {
      // This is a new node. We should create it if we can find it's parent.
      var nodeParent = tree.getNodeByKey(result.new_val.parent);
      if (nodeParent && nodeParent.children != null) {
        // If the nodes children array is null, that means it hasn't been expanded once yet,
        // let the node discover it's children when it expands for the first time.
        var node = nodeParent.addNode(nodeInfo);
      }

      return;
    }

    // Get the nodes parent id.
    var nodeParent = node.getParent();
    if (result.new_val.parent != nodeParent.key) {
      // This nodes parent was changed!
      // We should remove this node and re-add it.
      node.remove();

      // Add a new one...
      nodeParent = tree.getNodeByKey(result.new_val.parent);
      if (!nodeParent) {
        // Quit this function, the new parent isn't visible in the tree.
        // It probably hasn't been expanded yet. Wait until the user expands that
        // part of the tree on their own.
        return;
      }

      node = nodeParent.addNode(nodeInfo);
      return;
    }

    // The node already existed, update it.
    node.setTitle(result.new_val.name);
    node.data.type = result.new_val.type;
  });

});
