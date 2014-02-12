var config = require('./config')
<<<<<<< HEAD
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process'),
    unrarProcess;

exports.initUnrar = function(folder){
  resultRar = undefined;
  resultR00 = undefined;
	console.log('Unrar folder: ' + folder);
	fs.readdir(folder, function(err,files){
		//console.log(files);
    var i = 0;
    (function next() {
      var file = files[i++];
      if (!file) { //if all files are checked
        if( resultRar === undefined & resultR00 === undefined ){ //nothing found to unrar
          console.log('Nothing to unrar');
        }else{ // check if rar or r00
          if(resultRar){
            unrar(folder,resultRar)
          }else{
            unrar(folder, resultR00)
          }
        }
        return;
      }
      
      if(path.extname(file) === '.rar'){
        resultRar = file;
        console.log('RAR ' + file);
      }
      if(path.extname(file) === '.r00'){
        resultRar = file;
        console.log('R00 ' + file);
      }
      next();   
    })();
	});
}

var unrar = function(folder,file){
  unrarProcess = childProcess.exec('unrar e ' + folder + '/' + file + ' ' + folder, function (error, stdout, stderr) {
   if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
   }
   console.log('Child Process STDOUT: '+stdout);
   console.log('Child Process STDERR: '+stderr);
 });

 unrarProcess.on('exit', function (code) {
   console.log('Child process exited with exit code ' + code);
 });
};
=======
var RarArchive = require('rarjs');
var fs = require('fs');

exports.initUnrar = function(folder){
	console.log('Unrar folder: ' + folder);
	fs.readdir(folder, function(err,files){
		console.log(files);
	});
}

var file = RarArchive({type: RarArchive.OPEN_LOCAL, file: '/mnt/Downloads/Blue.Bloods.S02E15.Phantom.GERMAN.DUBBED.DL.720p.WebHD.h264-euHD/euhd-blue-s02e15-720p.r00'}, function(err) {
  this.entries.forEach(function(val) {
    console.log(val.path);
  });
});
>>>>>>> aa7b05d41bde6da31e049e0836ed642fb0c7017e
