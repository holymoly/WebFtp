/*
 * GET ftp page
 */
var fs = require('fs');
var fsPath = require('path');
var config = require('./config')
var unrar = require('./unrar');
var mkdirp = require('mkdirp');
var socketEventsListers = require('./socket')
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
var scanActive = undefined;
var scanTodoArray = [];

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
      //console.dir(list);
      socketEventsListers.emitInitRoot(list);
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
    console.log(data);
    // connect to localhost:21 as anonymous
    c.connect({ host: ftpUrl,
                port: ftpPort,
                secure: ftpTls, 
                secureOptions: {rejectUnauthorized: false},
                user: ftpUser,
                password: ftpPass });
  }else{
    console.log('Already conected');
    cb();
  }
};

//disconnect from ftp
exports.discon = function(){
  console.log('FTP disconnect');
  c.destroy();
};

//disconnect from ftp
var disconnect = function(data){
  console.log('Ftp disconnect');
  c.end();
};

//List folder
exports.list = function(path,socket){
  console.log('Path: ' + path);
  c.list(path, function(err, list) {
    if (err) throw err;
    //console.dir(list);
    list.forEach(function(item) {
      if(typeof(item.date) !== 'undefined'){
        item.date = item.date.toLocal() ;
      }
    });

    socketEventsListers.emitSetSubfolders(path, list);
  });
};

// Insert Entry into downloadlist
exports.addToDownloadList = function(newEntry,socket){
  
  console.log(newEntry);
  config.getDownloadList(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socketEventsListers.emitUpdateCountDownloadList('er');
        return;
      }
      data = JSON.parse(data);
      if(newEntry.type !== 'init'){
        data.push(newEntry);
          fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
            if(err) {
              console.log(err);
              socketEventsListers.emitUpdateCountDownloadList('er');
            } else {
              socketEventsListers.emitUpdateCountDownloadList(data.length);
              console.log("Item added");
            }
          });
      } else{
        console.log('Download list counter = ' + data.length);
        socketEventsListers.emitUpdateCountDownloadList(data.length);
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
        socketEventsListers.emitUpdateDownloadList('er');
        socketEventsListers.emitUpdateIndicator({type: 'indicatorDownloader', hidden: indicatorDownloader});
        return;
      } else {
        data = JSON.parse(data);
        socketEventsListers.emitUpdateDownloadList(data);
        socketEventsListers.emitUpdateIndicator({type: 'indicatorDownloader', hidden: indicatorDownloader});
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
        socketEventsListers.emitUpdateCountScannerList('er');
        return;
      }
      data = JSON.parse(data);
      if(newEntry.type !== 'init'){
        data.push(newEntry);
        fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
          if(err) {
            console.log(err);
            socketEventsListers.emitUpdateCountScannerList('er');
          } else {
            socketEventsListers.emitUpdateCountScannerList(data.length);
            console.log("Item added");
          }
        });
      } else{
        console.log('Scanner list counter = ' + data.length);
        socketEventsListers.emitUpdateCountScannerList(data.length);
      }
    });
  });
};

// When requested send Scan items to client
exports.initScannerList = function(socket){
  config.getScannerList(function(err, path){  
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socketEventsListers.emitInitScannerFolder('er');
        return;
      } else {
       data = JSON.parse(data);
       socketEventsListers.emitInitScannerFolder(data);
       socketEventsListers.emitUpdateIndicator({type: 'indicatorScanner', hidden: indicatorScanner});
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
                  recursivListFtpFilesFast(folder.path, 'ftpScan', socket, function (err, files) {
                    //Next folder
                    console.log(files);
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
  result = undefined;
  config.getDumpFile(function(err, dumpPath){ 
    fs.readFile(dumpPath, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socketEventsListers.emitInitScannerResultList('er');
        return;
      } else {
        socketEventsListers.emitInitScannerResultList(data);
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
          socketEventsListers.emitUpdateDownloadList(data);
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
      socketEventsListers.emitUpdateIndicator({type: 'indicatorDownloader', hidden: indicatorDownloader});

      if(index < data.length){  
        //Check if folder or file
        if(data[index].type === 'folder'){
          recursivListFtpFiles(data[index].path, 'downloadScan', function (err, files) {
            //download all files found in folder
            if(err){
              console.log(err);
            }

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
        socketEventsListers.emitUpdateIndicator({type: 'indicatorDownloader', hidden: indicatorDownloader});
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
var recursivListFtpFilesFast = function(dir, scanType, socket, cb){

  c.list(dir,function(err, list) {
    if (err) {
      console.log('Error for listing of: ' +  dir);
      console.log(err);
      //Try again
      recursivListFtpFilesFast(dir, scanType , socket, function(err, res) {
        if(err){
          console.log('Error scanning Folder: ' + dir);
          console.log(err);
        }
      });
      //return cb(err,dir);
    }
    if (typeof(list) !== 'undefined'){
      //build array with items to check
      
      list.forEach(function(file) {

        file.name = dir + '/' + file.name;
        if (file.type === 'd'){
          // Scan for folder on ftp
         
          if(scanType === 'ftpScan' & file.name.toUpperCase().indexOf('SAMPLE') === -1 
                                    & file.name.indexOf('[') === -1 
                                    & file.name.toUpperCase().indexOf('SUBS') === -1 
                                    & file.name.toUpperCase().indexOf('PROOF') === -1){
            scanTodoArray.push(file.name);
            //console.log('Added Item: ' + scanTodoArray.length + ' ' + file.name);
            socketEventsListers.emitScanFolderCounter(scanTodoArray.length);
            config.getDumpFile(function(err, dumpPath){ 
              fs.appendFile(dumpPath, file.name + '  ' + file.date.toLocal() + '\n', function (err) {
              });
            });
          
            recursivListFtpFilesFast(file.name, scanType ,  socket, function(err, res) {
              if(err){
                console.log('Error scanning Folder: ' + file.name);
                console.log(err);
              }
              scanTodoArray.splice(scanTodoArray.indexOf(file.name) ,1);
              //console.log('Removed Item: ' + scanTodoArray.length + ' ' + file.name);
              socketEventsListers.emitScanFolderCounter(scanTodoArray.length);
            
            });
          }
        }
        if(list[list.length -1] === file ){
          cb();
        }
      });
    }else{
      console.log('undefined ftp folder list');
    }
  });
};

// Downnload file from List and start over if more items available
var downloadAll = function(ftpFiles, folderPath, cb){
  size = 0;
  config.getDownloadPath(function(err, downloadFolder){
    if(err)
      console.log(err);
    var downloadPath = downloadFolder + ftpFiles[0].name.substring(ftpFiles[0].name.indexOf(fsPath.basename(folderPath)),ftpFiles[0].name.length);
    mkdirp(fsPath.dirname(downloadPath), function(err) { 
      if(err) throw err;
      console.log('Download to: ' + downloadPath);
      //Only download complete if file not exists or should be ignored elsewise skip or append
      checkIfFileAlreadyExists(downloadPath, function(status){
        config.getIgnoreItems(function(err, ignoerSubstrings){
          //check if file should be ignored
          //console.log(ignoerSubstrings);   
          checkIfFileShouldBeIgnored(ftpFiles[0].name,ignoerSubstrings,function(ignored){
            //console.log(ignored);
            if (status === 'not found' & ignored === false){
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
                    removeFileFromArray(downloadPath);
                  }else{
                    console.log('Wrong filesize, try to append download to file');

                    downloadAppendToFile(ftpFiles[0], folderPath, stats.size, function(err){
                      if (err) {
                        console.log(err);
                      }
                      removeFileFromArray(downloadPath);
                    });
                  }
                });
              });

              fileStream.once('error', function(error) { 
                console.log(error);
              });

              c.get(ftpFiles[0].name, function(err, stream) {
                size = 0;
                //console.log(ftpFiles[0]);
                stream.pipe(fileStream); 
                if (err) throw err;
                console.log('Download of ' + fsPath.basename(ftpFiles[0].name) +' started');
                
                stream.once('error', function (error) {
                  console.log(error);
                });

                stream.on('data', function (chunk) {
                  size = size + chunk.length
                  calcSize = size;
                  unit = 'B';
                  if (size >= 1024){
                    calcSize = size/1024;
                    unit = 'KB'
                  }
                  if (size >= 1048576){
                    calcSize = size/1048576;
                    unit = 'MB'
                  }
                  socketEventsListers.emitUpdateDownlaodProgres(calcSize.toFixed(1), unit, fsPath.basename(ftpFiles[0].name), ftpFiles.length);
                });

              });
            }else{
              //already downloaded
              if(ignored === false){
                if(ftpFiles[0].size === status.size){
                  console.log('already downloaded ' + ftpFiles[0].name);
                  removeFileFromArray(downloadPath);
                }else{
                  //append on partial local file
                  downloadAppendToFile(ftpFiles[0], folderPath, status.size, function(err){
                    if (err) {
                      console.log(err);
                    }
                    removeFileFromArray(downloadPath);
                  });
                }
              }else{
                console.log('Ignored ' + ftpFiles[0].name)
                removeFileFromArray(downloadPath);
              }
            }
          }); 
        });
      });
    });
  });
//*************
  function removeFileFromArray(file){
    ftpFiles.splice(0,1);
    console.log('Files to download: ' + ftpFiles.length);
    
    if(ftpFiles.length === 0){
      console.log('Download of Item completed');
      unrar.initUnrar(fsPath.dirname(file));
      cb('next');
    }else{
      downloadAll(ftpFiles,folderPath,cb);
      //unrar.initUnrar(fsPath.dirname(file));
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
//***************
  function checkIfFileShouldBeIgnored(file, ignoreItems, done){
    var i = 0;
    var found = false;

    (function next() {
      var item = ignoreItems[i++];
      if (!item) return done(found);
      if(file.toUpperCase().indexOf(item.toUpperCase()) !== -1){
        found = true;
        cb(found);
      }
      next(); 
    })();
  };
//***************
};

// Downnload file from List and start over if more items available
var downloadAppendToFile = function(ftpFile, folderPath, offset, cb){
  
  
  config.getDownloadPath(function(err, downloadFolder){
    var downloadPath = downloadFolder + ftpFile.name.substring(ftpFile.name.indexOf(fsPath.basename(folderPath)),ftpFile.name.length)
    //console.log('***************************');
    //console.log(ftpFile);
    //console.log('Folder: ' + folderPath);
    //console.log(fsPath.basename(folderPath));
    console.log('Append to: ' + downloadPath);
    //console.log('***************************');
    //Filestream that appends the data
    var fileStream = fs.createWriteStream(downloadPath,{  'flags': 'a'
                                                        , 'encoding': null
                                                        });
    //Emitted when file is completed on disk
    fileStream.once('finish', function() { 
      console.log('Append of ' + fsPath.basename(ftpFile.name) +' finished');
      console.log('Size online: ' + ftpFile.size);
      fs.stat(downloadPath, function (err, stats) {
        console.log('Size local:  ' + stats.size);
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
        stream.on('data', function (chunk) {
          size = size + chunk.length
          calcSize = size;
          unit = 'B';
          if (size >= 1024){
            calcSize = size/1024;
            unit = 'KB'
          }
          if (size >= 1048576){
            calcSize = size/1048576;
            unit = 'MB'
          }
          socketEventsListers.emitUpdateDownlaodProgres(calcSize.toFixed(1), unit, fsPath.basename(ftpFile.name) + ' (append)', 0);
        });
      });
    });
  });
};


//Delete on item from Downloadlists
exports.deleteDownloadItem = function(item,socket){
  deleteFromList(item, socket);
};

//Delete on item List
var deleteFromList = function(item, socket){
  //console.log(data);
  config.getDownloadList(function(err, path){
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        socketEventsListers.emitUpdateCountDownloadList('er');
        return;
      }
      data = JSON.parse(data);

      data.forEach(function(entry) {
        if (entry.path == item.path){
          data.splice(data.indexOf(entry) ,1);
          fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
            if(err) {
              console.log(err);
              socketEventsListers.emitUpdateCountDownloadList('er');
            } else {
              socketEventsListers.emitUpdateCountDownloadList(data.length);
              socketEventsListers.emitUpdateDownloadList(data);
              console.log("Item deleted");
            }
          });
        }
      });
    });
  });
};

Date.prototype.toLocal = function() {
  var Year = this.getFullYear().toString();
  var Month = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var Day  = this.getDate().toString();
  var Hour  = this.getHours().toString();
  var Minute  = this.getMinutes().toString();
  var Second  = this.getSeconds().toString();
  return Year + '-' + (Month[1]?Month:"0"+Month[0]) + '-' + (Day[1]?Day:"0"+Day[0]) + "_" + (Hour[1]?Hour:"0"+Hour[0]) + ":" + (Minute[1]?Minute:"0"+Minute[0]) + ":" + (Second[1]?Second:"0"+Second[0]);
};
