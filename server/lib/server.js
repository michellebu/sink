var url = require('url');
var WebSocketServer = require('ws').Server;

function SinkServer(port) {

  var self = this;

  port = port || 8080;

  // Maps namespaces to rooms.
  this.rooms = {};

  // Start Websocket server.
  this.wss = new WebSocketServer({port: port});
  this.wss.on('connection', function(ws) {

    // Parse request url.
    var wsurl = url.parse(ws.upgradeReq.url, true);
    var room = self.getRoom(wsurl.query.room);
    room.add(ws);

    // On a message, parse it.
    // [ (TYPE), (PROPERTY NAME), (PROPERTY VALUE), (VERSION #)? ]
    ws.on('message', function(message) {
      console.log('received: %s', message);

      // Try to parse the message.
      try {
        message = JSON.parse(message);
      } catch (e) {
        return;
      }

      if (message[0] === 'update') {
        room.update(message, ws);
      }
    });

    ws.on('close', function() {
      room.remove(ws);
    });

  });
  console.log('SinkServer running on port', port);
};

// Get a room.
SinkServer.prototype.getRoom = function(room) {
  if (!this.rooms[room]) {
    this.rooms[room] = new Room(room);
  }
  return this.rooms[room];
};

function Room(namespace) {
  // TODO: save history?
  this.namespace = namespace;
  this.connections = {};
  this.version = 1;
  this.object = {};
  // IDs for WS.
  this.count = 0;
};

// Adds a connection, sending it the updated object.
Room.prototype.add = function(ws) {
  ws.id = this.count;
  this.count += 1;

  // Send the entire object.
  ws.send(JSON.stringify(['init', this.object, this.version]));

  // Push socket to connections.
  this.connections[ws.id] = ws;
};

// Remove a connection, sending it the updated object.
Room.prototype.remove = function(ws) {
  delete this.connections[ws.id];
};

// Updates server version and sends updates to all clients in room.
Room.prototype.update = function(updates, from) {
  var version = updates[2];
  updates = updates[1];

  // Check if collision.
  if (version && version !== this.version) {
    var old_fields = [];
    for (var i = 0, ii = updates.length; i < ii; i += 1) {
      var field = updates[i][0]
      old_fields.push([field, this.object[field]]);
    }
    //old_fields.push([updates[1], updates[2]]);
    from.send(JSON.stringify(['collision', old_fields, this.version]));
    return;
  }

  // Sync with self.
  this.sync(updates);
  this.version += 1;

  // Update all clients.
  var ids = Object.keys(this.connections);
  console.log(ids)
  for (var i = 0, ii = ids.length; i < ii; i += 1) {
    var connection = this.connections[ids[i]];
    if (connection.id !== from.id) {
      console.log('sending')
      connection.send(JSON.stringify(['update', updates, this.version]));
    }
  }

  // Notify original client of success.
  from.send(JSON.stringify(['success', this.version]));
};

Room.prototype.sync = function(updates) {
  // Update all properties.
  for (var i = 0, ii = updates.length; i < ii; i += 1) {
    this.object[updates[i][0]] = updates[i][1];
  }
  //this.object[updates[1]] = updates[2];
}


exports.SinkServer = SinkServer;
