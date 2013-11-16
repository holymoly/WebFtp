/*
 * GET ftp page
 */

var fs = require('fs');
var storedServerFile = './storedFtp.json';
var Client = require('ftp');
var c = new Client();

var ftpUrl = '';
var ftpPort = '';
var ftpTls = '';
var ftpUser = '';
var ftpPass = '';


//Save Server Config
exports.save = function(newEntry){
  fs.readFile(storedServerFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
 
    data = JSON.parse(data);
    data.push(newEntry);

    fs.writeFile(storedServerFile, JSON.stringify(data , null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("JSON saved");
        }
    }); 

  });
};

//Connect to Server
exports.connect = function(data,socket){
  console.log(data);
  // Store or connect
  

  c.on('ready', function() {
    c.list(function(err, list) {
      if (err) throw err;
      console.dir(list);
      socket.emit('initialFolder',list);
      c.end();
    });
  });

  ftpUrl = data.ftpUrl;
  ftpPort = data.ftpPort;
  ftpTls = data.ftpTls;
  ftpUser = data.ftpUser;
  ftpPass = data.ftpPass;

  // connect to localhost:21 as anonymous
  c.connect({ host: ftpUrl,
              port: ftpPort,
              secure: ftpTls, 
              secureOptions: {rejectUnauthorized: false},
              user: ftpUser,
              password: ftpPass });
};

//Connect to Server
exports.list = function(path,socket){
  console.log('Path: ' + path);
  // Store or connect
  var c = new Client();

  c.on('ready', function() {
    c.list(path, function(err, list) {
      if (err) throw err;
      console.dir(list);
      socket.emit('setSubfolders', path,list);
      c.end();
    });
  });

  // connect to localhost:21 as anonymous
  c.connect({ host: ftpUrl,
              port: ftpPort,
              secure: ftpTls, 
              secureOptions: {rejectUnauthorized: false},
              user: ftpUser,
              password: ftpPass });
};

