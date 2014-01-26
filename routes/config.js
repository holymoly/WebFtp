/*
 * GET configuration
 */

var fs = require('fs');
var configFile = './store/config.json';
 
//Returns path of Download folder
exports.getDownloadPath= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.pathDownloads);
  });
};

//Returns path of Tv Show folder
exports.getTvShowPath= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.pathTvShows);
  });
};

//Returns list of Items to be downloaded
exports.getDownloadList= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.downloadList);
  });
};

//Returns Dumpfile of FTP
exports.getDumpFile= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.dumpFile);
  });
};

//Returns Dumpfile of FTP
exports.getMatchedTvShows= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err,data.paths.matchedTvShows);
  });
};

//Returns List of Folders to scan
exports.getScannerList= function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.scannerList);
  });
};

//Returns List of stored login credentials
exports.getStoredFtp = function(cb){
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    //console.dir(data);
    cb(err, data.paths.storedFtp);
  });
};

// When requested send Configuration
exports.initConfig = function(socket){

  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    } else {
      data = JSON.parse(data);
      socket.emit('initialConfig', {pathTvShows : data.paths.pathTvShows, 
                                    pathDownloads : data.paths.pathDownloads,
                                    downloadList : data.paths.downloadList,
                                    dumpFile : data.paths.dumpFile,
                                    matchedTvShows : data.paths.matchedTvShows,
                                    scannerList : data.paths.scannerList,
                                    storedFtp : data.paths.storedFtp });     
    }
  });
};

// When requested save configuration
exports.saveConfig = function(data,socket){

  fs.readFile(configFile, 'utf8', function (err, file) {
    if (err) {
      console.log('Error: ' + err);
      return;
    } else {
      file = JSON.parse(file);
      file.paths.pathTvShows = data.pathTvShows;
      file.paths.pathDownloads = data.pathDownloads;
      file.paths.downloadList = data.downloadList;
      file.paths.dumpFile = data.dumpFile;
      file.paths.matchedTvShows = data.matchedTvShows;
      file.paths.scannerList = data.scannerList;
      file.paths.storedFtp = data.storedFtp;

      fs.writeFile(configFile, JSON.stringify(file , null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Config saved");
        }
    }); 
    }
  });
};

// When requested save configuration
exports.initConfigFiles = function(data,socket){
  var init = [];

  fs.writeFile(data.downloadList, JSON.stringify(init , null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Download list init");
    }
  });
  fs.writeFile(data.dumpFile, JSON.stringify(init , null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Download list init");
    }
  });
  fs.writeFile(data.matchedTvShows, JSON.stringify(init , null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Download list init");
    }
  });
  fs.writeFile(data.scannerList, JSON.stringify(init , null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Download list init");
    }
  });
  fs.writeFile(data.storedFtp, JSON.stringify(init , null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Download list init");
    }
  });
};