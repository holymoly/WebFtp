/*
 * GET ftp page
 */
var fs = require('fs');
var fsPath = require('path');
var config = require('./config')
var mkdirp = require('mkdirp');
//var storedServerFile = './store/storedFtp.json';
//var downloadList = './store/downloadList.json';
//var scannerList = './store/scannerList.json';
//var dumpFile = './store/dumpFile.txt';
var Client = require('ftp');
var c = new Client();

var ftpUrl = '';
var ftpPort = '';
var ftpTls = '';
var ftpUser = '';
var ftpPass = '';

var indicatorScanner = true;
var indicatorDownloader = true;
var busy = undefined;

//Save Server Config
exports.save = function(newEntry){
  config.getStoredFtp(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
   
      data = JSON.parse(data);
      data.push(newEntry);

      fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("JSON saved");
        }
      }); 
    });
  });
};

//Connect to Server
exports.initRoot = function(data,socket){
  //console.log(data); 
  connect(data, function(){
    c.list(function(err, list) {
      if (err) throw err;
      console.dir(list);
      socket.emit('initialFolderFtp',list);
    }); 
  });
};

//connect to ftp
var connect = function(data,cb){
  if(c.connected === false){  
    c.once('ready', function() {
      cb();
    });

    ftpUrl = data.ftpUrl;
    ftpPort = data.ftpPort;
    ftpTls = data.ftpTls;
    ftpUser = data.ftpUser;
    ftpPass = data.ftpPass;
    // connect to localhost:21 as anonymous
    c.connect({ host: ftpUrl,
                port: ftpPort,
                secure: true, 
                secureOptions: {rejectUnauthorized: false},
                user: ftpUser,
                password: ftpPass });
  }else{
    console.log('Already conected');
    cb();
  }
};

//disconnect from ftp
var disconnect = function(data){
  c.end();
};

//List folder
exports.list = function(path,socket){
  console.log('Path: ' + path);
  c.list(path, function(err, list) {
    if (err) throw err;
    console.dir(list);
    socket.emit('setSubfolders', path,list);

  });
};

// Insert Entry into downloadlist
exports.addToDownloadList = function(newEntry,socket){
  
  console.log(newEntry);
  config.getDownloadList(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('updateCountDownloadList', 'er');
        return;
      }
      data = JSON.parse(data);
      if(newEntry.type !== 'init'){
        data.push(newEntry);
          fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
            if(err) {
              console.log(err);
              socket.emit('updateCountDownloadList', 'er');
            } else {
              socket.emit('updateCountDownloadList', data.length)
              console.log("Item added");
            }
          });
      } else{
        console.log('Download list counter = ' + data.length);
        socket.emit('updateCountDownloadList', data.length);
      }
    });
  });
};

// When requested send downloadlist to client
exports.initDownloadList = function(socket){
  config.getDownloadList(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('updateDownloadList', 'er');
        socket.emit('indicator', {type: 'indicatorDownloader', hidden: indicatorDownloader});
        return;
      } else {
        data = JSON.parse(data);
        socket.emit('updateDownloadList', data);
        socket.emit('indicator', {type: 'indicatorDownloader', hidden: indicatorDownloader});
      }
    });
  });
};

// Insert Entry into scannerlist
exports.addToScannerList = function(newEntry,socket){
  console.log(newEntry);
  config.getScannerList(function(err, path){  
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('updateCountScannerList', 'er');
        return;
      }
      data = JSON.parse(data);
      if(newEntry.type !== 'init'){
        data.push(newEntry);
        fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
          if(err) {
            console.log(err);
            socket.emit('updateCountScannerList', 'er');
          } else {
            socket.emit('updateCountScannerList', data.length)
            console.log("Item added");
          }
        });
      } else{
        console.log('Scanner list counter = ' + data.length);
        socket.emit('updateCountScannerList', data.length);
      }
    });
  });
};

// When requested send dowloadlist to client
exports.initScannerList = function(socket){
  config.getScannerList(function(err, path){  
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('initialScannerFolder', 'er');
        return;
      } else {
       data = JSON.parse(data);
       socket.emit('initialScannerFolder', data);
       socket.emit('indicator', {type: 'indicatorScanner', hidden: indicatorScanner});
      }
    });
  });
};

// When requested scan
exports.scanFtp = function(data, socket){
  connect(data,function(){
    config.getDumpFile(function(err, dumpPath){ 
      var datetime = new Date();
      var backupName = dumpPath + '_' + datetime.getFullYear() + '_' + (datetime.getMonth() + 1) + '_' + datetime.getDate() + '_' + datetime.getHours()  + '_' + datetime.getMinutes() + '_' + datetime.getSeconds();
      //backup old file
    
      fs.rename(dumpPath, backupName, function (err) {
        fs.writeFile(dumpPath, '', function(){
          if (err) throw err;
          console.log('Old dump file saved to: ' + backupName);
          //read paths to scann
          config.getScannerList(function(err, path){  
            fs.readFile(path, 'utf8', function (err, data) {
              if (err) {
                console.log('Error during reading of scanner file: ' + err);
                return;
              } else {
                data = JSON.parse(data);
                console.log(data);
                data.forEach(function(folder) {
                  recursivListFtpFilesFast(folder.path, 'ftpScan', function (err, files) {
                    //Next folder
                    if (err) return console.log(err);
                  });
                });
              }
            }); 
          });       
        });
      }); 
    }); 
  });
};

// When requested send scanner results to to client
exports.initScannerResultList = function(socket){
  config.getDumpFile(function(err, dumpPath){ 
    fs.readFile(dumpPath, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('initialScannerResultList', 'er');
        return;
      } else {
       //data = JSON.parse(data);
       socket.emit('initialScannerResultList', data);
      }
    });
  });
};

//Download the Download List to Server
exports.initDownload = function(data,socket){
  connect(data, function(){
    //console.log(data);
    config.getDownloadList(function(err, path){
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          console.log('Error: ' + err);
          socket.emit('updateDownloadList', 'er');
          return;
        } else {
          data = JSON.parse(data);
          //Find file for each downloadlist entry
          
          console.log('*******Sart Download*******');
          oneDownloadAfterTheOther(data,0);
        }
      });
    });
//*************
    function oneDownloadAfterTheOther(data,index){
      indicatorDownloader = false;
      socket.emit('indicator', {type: 'indicatorDownloader', hidden: indicatorDownloader});

      if(index < data.length){  
        //Check if folder or file
        if(data[index].type === 'folder'){
          recursivListFtpFiles(data[index].path, 'downloadScan', function (err, files) {
            //download all files found in folder
            downloadAll(files, data[index].path, function (status) {
              if(status === 'next'){
                console.log(status);
                console.log('Deleting ' + data[index].path + ' from List');
                deleteFromList({path : data[index].path}, socket);

                oneDownloadAfterTheOther(data, index + 1, socket);
              }
            });
          });
        }else{
          var fileArray = [];
          c.size(data[index].path, function(err, fileSize){
            console.log(fileSize);
            fileArray.push({name : data[index].path,
                            size : fileSize});
            //console.log(data.path);

            downloadAll(fileArray, data[index].path, function () {
                console.log('Deleting ' + data[index].path + ' from List');
                deleteFromList({path : data[index].path}, socket);

                oneDownloadAfterTheOther(data, index + 1, socket);
            });
          });
        }
      }
      else{
        indicatorDownloader = true;
        socket.emit('indicator', {type: 'indicatorDownloader', hidden: indicatorDownloader});
        console.log('Downloads finished');
        c.end();
      }
    }
//*************
 });
};

//List folder or files
var recursivListFtpFiles = function(dir,scanType,done){
  var ftpFiles = [];

  c.list(dir,function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, ftpFiles);
      
      file.name = dir + '/' + file.name;
       if (file.type === 'd'){
          if(scanType === 'ftpScan' & file.name.toUpperCase().indexOf('SAMPLE') === -1 & file.name.indexOf('[SAS') === -1 & file.name.toUpperCase().indexOf('SUBS') === -1 & file.name.toUpperCase().indexOf('PROOF') === -1){
            config.getDumpFile(function(err, dumpPath){ 
              fs.appendFile(dumpPath, file.name + '  ' + file.date + '\n', function (err) {
              });
            });
          }
          recursivListFtpFiles(file.name, scanType, function(err, res) {
            if(typeof(res) !== 'undefined'){
              ftpFiles = ftpFiles.concat(res);
            }
            next();
          });
        } else {
          if(typeof(file.name) !== 'undefined'){
            ftpFiles.push(file);
          }
          next();
        }
    })();
  });
};

//List folder or files fast paralell
var recursivListFtpFilesFast = function(dir,scanType,cb){
  var results = [];
  c.list(dir,function(err, list) {
    if (err) {
      //console.log(dir);
      return cb(err,dir);
    }
    //console.log(list.length);
    if (typeof(list) !== 'undefined'){
      var pending = list.length;
      if (!pending) return cb(null, results);
      list.forEach(function(file) {
        file.name = dir + '/' + file.name;
        //console.log(file);
        if (file.type === 'd'){
          // Scan for folder on ftp
          if(scanType === 'ftpScan' & file.name.toUpperCase().indexOf('SAMPLE') === -1 & file.name.indexOf('[SAS') === -1 & file.name.toUpperCase().indexOf('SUBS') === -1 & file.name.toUpperCase().indexOf('PROOF') === -1){
            config.getDumpFile(function(err, dumpPath){ 
              fs.appendFile(dumpPath, file.name + '  ' + file.date + '\n', function (err) {
              });
            });
          
            recursivListFtpFilesFast(file.name, scanType , function(err, res) {
              if(err){
                console.log(err);
                //console.log(file.name);
                return cb(err);
              }
              results = results.concat(res);
              if (!--pending) cb(null, results);
            });
          }
        } else {    
          results.push(file);
          if (!--pending) cb(null, results);
        }
      });
    }else{
      console.log('undifned ftp folder list');
    }
  });
};

// Downnload file from List and start over if more items available
var downloadAll = function(ftpFiles, folderPath, cb){
  //console.log(ftpFiles[0]);
  //console.log('Folder: ' + folderPath);
  //console.log(fsPath.basename(folderPath));
  //console.log(ftpFiles[0].name.substring(ftpFiles[0].name.indexOf(fsPath.basename(folderPath)),ftpFiles[0].name.length));
  
  config.getDownloadPath(function(err, downloadFolder){
    var downloadPath = downloadFolder + ftpFiles[0].name.substring(ftpFiles[0].name.indexOf(fsPath.basename(folderPath)),ftpFiles[0].name.length);
    mkdirp(fsPath.dirname(downloadPath), function(err) { 

      console.log(downloadPath);
      //Only download completly if file not exists elsewise skip or append
      checkIfFileAlreadyExists(downloadPath, function(status){
        if (status === 'not found'){
          var fileStream = fs.createWriteStream(downloadPath,{  'flags': 'w'
                                                              , 'encoding': null
                                                              , 'mode': 0775
                                                              });
          //Emitted when file is completed on disk
          fileStream.once('finish', function() { 
            //**** Print Results and compare online and local size
            console.log('Download of ' + fsPath.basename(ftpFiles[0].name) +' finished');
            console.log('Size online: ' + ftpFiles[0].size);
            fs.stat(downloadPath, function (err, stats) {
              console.log('Size local:  ' + stats.size);
              //Compare if online = local size
              if(ftpFiles[0].size === stats.size){
                //Remove first item(Last downloaded item)
                removeFileFromArray();
              }else{
                console.log('Wrong filesize, try to append download to file');

                downloadAppendToFile(ftpFiles[0], stats.size, function(err){
                  if (err) {
                    console.log(err);
                  }
                  removeFileFromArray();
                });
              }
            });
          });

          fileStream.once('error', function(error) { 
            console.log(error);
          });

          c.get(ftpFiles[0].name, function(err, stream) {
            //console.log(ftpFiles[0]);
            stream.pipe(fileStream); 
            if (err) throw err;
            console.log('Download of ' + fsPath.basename(ftpFiles[0].name) +' started');

            stream.once('error', function (error) {
              console.log(error);
            });
          });
        }else{
          //already downloaded
          if(ftpFiles[0].size === status.size){
            console.log('already downloaded ' + ftpFiles[0].name);
            removeFileFromArray();
          }else{
            //append on partial local file

            downloadAppendToFile(ftpFiles[0], status.size, function(err){
              if (err) {
                console.log(err);
              }
              removeFileFromArray();
            });
          }
        }
      });

    });
    
    
  });
//*************
  function removeFileFromArray(){
    ftpFiles.splice(0,1);
    console.log('Files to download: ' + ftpFiles.length);
    
    if(ftpFiles.length === 0){
      console.log('Download of Item completed');
      cb('next');
    }else{
      downloadAll(ftpFiles,cb);
      cb('wait');
    }
  };
//***************
//***************
  function checkIfFileAlreadyExists(file,cb){
    fs.stat(file, function(err, stats) {
        if (err) {
            //console.log(err);
            cb('not found');
        }else{
          cb(stats);
        }
    });
  };
//***************
};

// Downnload file from List and start over if more items available
var downloadAppendToFile = function(ftpFile, offset, cb){
  config.getDownloadPath(function(err, downloadFolder){
    var downloadPath = downloadFolder + fsPath.basename(ftpFile.name);
    //Filestream that appends the data
    var fileStream = fs.createWriteStream(downloadPath,{  'flags': 'a'
                                                        , 'encoding': null
                                                        });
    //Emitted when file is completed on disk
    fileStream.once('finish', function() { 
      fs.stat(downloadPath, function (err, stats) {
        //Compare if online = local size
        if(ftpFile.size === stats.size){
          fs.chmod(downloadPath, '775');
          cb();
        }else{
          cb('Error: After Appending to file, Size does not match');
        }
      });
    });

    c.restart(offset,function(err){
      if (err) throw err;
      c.get(ftpFile.name, function(err, stream) {
        stream.pipe(fileStream);
      });
    });
  });
};


//Delete on item from Downloadlists
exports.deleteDownloadItem = function(item,socket){
  deleteFromList(item, socket);
};

//Delete on item List
var deleteFromList= function(item, socket){
  //console.log(data);
  config.getDownloadList(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('updateCountDownloadList', 'er');
        return;
      }
      data = JSON.parse(data);

      data.forEach(function(entry) {
        if (entry.path == item.path){
          data.splice(data.indexOf(entry) ,1);
          fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
            if(err) {
              console.log(err);
              socket.emit('updateCountDownloadList', 'er');
            } else {
              socket.emit('updateCountDownloadList', data.length)
              socket.emit('updateDownloadList', data)
              console.log("Item deleted");
            }
          });
        }
      });
    });
  });
};