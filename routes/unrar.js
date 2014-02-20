var config = require('./config')
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

var unrar = function(folder,rarFile){
  var startTime = new Date().getTime();
  var endTime = undefined;

  unrarProcess = childProcess.exec('unrar x ' + folder + '/' + rarFile + ' ' + folder, function (error, stdout, stderr) {
    endTime = new Date().getTime();

    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+stdout);
    console.log('Child Process STDERR: '+stderr);
    console.log('Duration of unrar: ' + ((endTime - startTime)/1000) + 's');
    fs.readdir(folder, function(err,files){
      files.forEach(function(file) {
        if(path.extname(file).indexOf('.r') !== -1){ 
          fs.unlink( folder + '/' + file, function(){
            console.log('Deleted file ' + file);
          });
        }
      });
    });
  });
 
  unrarProcess.on('exit', function (code) {
    console.log('Child process exited with exit code ' + code);
  });
}