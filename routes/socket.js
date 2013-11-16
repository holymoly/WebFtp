
/*
 * Handling socket events
 */
var ftp = require('./ftp');
var fs = require('fs');
var storedServerFile = './storedFtp.json';

// Triggers the connect
exports.connect = function(socket){
  socket.on('connect', function(data) {
    ftp.connect(data,socket);
  });
};

// Triggers the connect
exports.list = function(socket){
  socket.on('list', function(data) {
    ftp.list(data,socket);
  });
};

// Save Config the connect
exports.saveConfig = function(socket){
  socket.on('saveConfig', function(data) {
    ftp.save(data);
  });
};


// Get Stored servers
exports.getStoredServers = function(socket){
  socket.on('getStoredServers', function() {
    console.log('Checking stored Server');
    fs.readFile(storedServerFile, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
 
      data = JSON.parse(data);
      socket.emit('receiveStoredServers',data);
    });
  });
};
