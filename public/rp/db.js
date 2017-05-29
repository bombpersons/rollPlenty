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
      {title: "Root", lazy: true, nodeId: null},
    ],

    lazyLoad: function(event, data) {
      var node = data.node;

      // Get any children of this node from the server if we can.
      data.result = new Promise(function(resolve, reject) {
        socket.emit('getChildNodes', node.data.nodeId, function(dump) {
          var results = [];

          // Process the data into the form fancytree wants.
          var length = dump.length;
          for (var i = 0; i < length; i++) {
            var item = dump[i];
            results.push({
              title: item.name,
              nodeId: item.id,
              lazy: true
            });
          }

          resolve(results);
        });
      });
    },

    // Context menu.
    contextMenu: {
      menu: {
        new: { "name": "New", "icon": "new" },
        delete: { "name": "Delete", "icon": "delete" },
      },
      actions: {
        new: function(node, options) {
          console.log(node);
          socket.emit('createNode', 'custom_name', 'custom_type', node.data.nodeId, function(nodeId) {
            // Force a reload of this node so that the new node is visible straight away.
            node.load(true);
          });
        },
        delete: function(node, options) {
          alert("DELETE");
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
        socket.emit('renameNode', node.data.nodeId, input, function() {
          console.log(input);
          node.setTitle(input);
        });
      },
      close: $.noop,       // Editor was removed
    },

    extensions: ["dnd", "edit", "glyph", "wide", "contextMenu"],
    checkbox: true,
    dnd: {
      focusOnClick: true,
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
    var tree = $('#tree').fancytree("getTree");
    tree.reload();
  });

});
