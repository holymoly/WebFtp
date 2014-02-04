var config = require('./config')
var RarArchive = require('rarjs');
var fs = require('fs');

exports.initUnrar = function(folder){
  resultRar = undefined;
  resultR00 = undefined;
	console.log('Unrar folder: ' + folder);
	fs.readdir(folder, function(err,files){
		//console.log(files);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null);
      
      if(path.extname(file) === 'rar'){
        resultRar = file;
        console.log(file);
      }
      if(path.extname(file) === 'r00'){
        resultRar = file;
        cosnole.log(file);
      }
      next();
        
    })();
	});
}
/*
var file = RarArchive({type: RarArchive.OPEN_LOCAL, file: '/mnt/Downloads/Blue.Bloods.S02E15.Phantom.GERMAN.DUBBED.DL.720p.WebHD.h264-euHD/euhd-blue-s02e15-720p.r00'}, function(err) {
  this.entries.forEach(function(val) {
    console.log(val.path);
  });
});
*/