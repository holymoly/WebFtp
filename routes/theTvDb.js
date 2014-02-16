var fs = require('fs');
//var matchedTvShows = './store/matchedTvShows.json';
//var dumpFile = './store/dumpFile.txt';
var config = require('./config');

var tvDB    = require("thetvdb-api"),
    key     = "3928F2D970CE9931";


// When requested send scanner results to to client
exports.initTvShowList = function(socket){

  config.getTvShowPath(function(err, tvShowPath){
    fs.readdir(tvShowPath, function(err, data) {
      if (err) {
        console.log('Error: ' + err);
        socket.emit('initialTvShowResultList', 'er');
        return;
      } else {

        config.getMatchedTvShows(function(err,path){
          fs.readFile(path, 'utf8', function (err, matchedData) {
            if (err) {
              console.log('Error: ' + err);
              //socket.emit('initialScannerFolder', 'er');
              return;
            } else {
              matchedData = JSON.parse(matchedData);
              //data = JSON.parse(data);

              data.forEach(function (item){
                socket.emit('initialTvShowResultList', item);
              
                //Check if TvShow already exists and delete if so
                matchedData.forEach(function(matchdedItem) {            
                  if(matchdedItem.originname == item ){
                     socket.emit('markMatchedTvShow', item);
                  }
                });
              });
            }
          });
        });
      }
    });
  });
};

//Get Tv Show Names
exports.checkTvShow = function(data,socket){
  tvDB(key).getSeries(data.name, function(err, tvShows) {
    if (!err) {
      console.log(data);
      //Check if Series was found
      if (tvShows.Data.Series !== undefined){
        //Check if more than one was found  
        if (tvShows.Data.Series.length === undefined){
          var tempArray = [];
          tempArray.push(tvShows.Data.Series);
          socket.emit('TvShowResultList', tempArray,  data.originname);
        }
        else{
          socket.emit('TvShowResultList', tvShows.Data.Series,  data.originname);
        }
      }
      else{
        //nothing was found
        var tempArray = [{ seriesid: 0,
                           language: '',
                           SeriesName: 'not found',
                           banner: '',
                           FirstAired: '',
                           Network: '',
                           IMDB_ID: '',
                           id: 0 }];
        socket.emit('TvShowResultList', tempArray, data.originname);
      }
    }
  });
};

//Bind Offline Online TvShow
exports.bindOfflineOnlineTvShow = function(TvShowData,socket){
  config.getMatchedTvShows(function(err,path){ 
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        //socket.emit('initialScannerFolder', 'er');
        return;
      } else {
      data = JSON.parse(data);
      
      //Check if TvShow already exists and delete if so
      data.forEach(function(item) {  
        
        if(item.originname == TvShowData.originname ){
          data.splice(data.indexOf(item),1);
          console.log(data);
        }
      });
      //Add new Entry and write to file
      data.push(TvShowData);
      fs.writeFile(path, JSON.stringify(data , null, 4), function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("TvShow added");
            socket.emit('markMatchedTvShow', TvShowData.originname);
          }
        });
      }
    });
  });
};

// When requested send Tv Shows to client
exports.initLostEpisodesList = function(socket){

  // /Volumes/Media/TvShows
  config.getMatchedTvShows(function(err,path){
    fs.readFile(path, 'utf8', function (err, matchedData) {
      if (err) {
        console.log('Error: ' + err);
        //socket.emit('initialScannerFolder', 'er');
        return;
      } else {
        matchedData = JSON.parse(matchedData);
        //data = JSON.parse(data);
        matchedData.sort(sort_by('originname', true, function(a){return a.toUpperCase()}));
        matchedData.forEach(function (item){
          socket.emit('initialLostEpisodesList', {originname:item.originname, seriesid:item.seriesid});     
        });
      }
    });
  });
};

// When requested check episodes of tv shows
exports.checkEpisodes = function(data,socket){
  var id = data.seriesid;
  var episodesOnline = []; // storing episodes while searching
  
  console.log(id);

  //Check online for aired episodes
  tvDB(key).getSeriesAllById(id,function(err, res) {
    if (!err) {
      res.Data.Episode.forEach(function (item){
        var episodeString = '';
        if (item.SeasonNumber < 10){
          episodeString = 'S0'+ item.SeasonNumber;
        }else{
          episodeString = 'S'+ item.SeasonNumber;
        }
        if (item.EpisodeNumber < 10){
          episodeString = episodeString + 'E0' + item.EpisodeNumber;
        }else{
          episodeString = episodeString + 'E' + item.EpisodeNumber;
        }
        //Exclude S00 Episodes
        if(episodeString.indexOf('S00') === -1){
          episodesOnline.push(episodeString);
        }
      });

      //Check offline episodes
      config.getTvShowPath(function(err, tvShowPath){
        walk(tvShowPath + data.originname + '/',function(err,episodesOffline){
          if(!err){
            //console.log(episodesOffline);

            for (var i = 0; i < episodesOnline.length; i++){
            //episodesOnline.forEach(function(itemOnline) {  
        
              episodesOffline.forEach(function(itemOffline){ 

                if(itemOffline.toUpperCase().indexOf(episodesOnline[i])> -1){
                  console.log('Cut:' + episodesOnline[i]);
                  episodesOnline.splice(i,1);
                  i--;
                }
              });
            }
            //Submitting missing episodes
            socket.emit('lostEpisodes', episodesOnline);
            //Check if missing episodes are in the dump file
            findEpisodes(data.name, episodesOnline, function(foundEpisodes){
              //********************
              //console.log(foundEpisodes);
              socket.emit('foundedEpisode', foundEpisodes);
            });

          }else{
            console.log(err);
          }
        });
      });
    }
  });
};

//Recursiv through directory
var walk = function(dir, cb) {
  var results = [];

  fs.readdir(dir, function(err, list) {
    if (err) return cb(err);
    var pending = list.length;
    if (!pending) return cb(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) cb(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) cb(null, results);
        }
      });
    });
  });
};

//Check if missing episodes are in the dump file
var findEpisodes = function(tvShowName,episodesArray, cb) {
  //Read and dump file and split it into an array
  config.getDumpFile(function(err,path){
    fs.readFile(path, function(err, data) {
      if(err) throw err;
      var folderArray = data.toString().split('\n');
      //check each folder if it contains SxxExx, if so check for name
      folderArray.forEach(function(folder) {
        episodesArray.forEach(function(episode) {
          if(folder.indexOf(episode) > -1){
            if(folder.replace(/\./g,' ').indexOf(tvShowName) > -1 ){
              //Cut of time and only submit folder name
              cb(folder.split('  ')[0]);
            }
          }
        });
        //console.log(folder);
      });
    });
  });
};

//Sorting function
var sort_by = function(field, reverse, primer){
   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = [-1, 1][+!!reverse];

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    } 
}

