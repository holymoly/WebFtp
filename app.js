
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var socketEventsListers = require('./routes/socket')

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/downloadList', user.downloadList);
app.get('/scanner', user.scanner);
app.get('/tvShows', user.tvShows);
app.get('/lostEpisodes', user.lostEpisodes);
app.get('/config', user.config);

// start Server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
//io.set('log level', 1); // reduce logging

// Creating listeners and events on client socket connection
io.set('log level', 1); // reduce logging
io.sockets.on('connection', function (socket) {
 
  // Add listener for ftp events
  console.log('connect');
  socketEventsListers.setSessionSocket(socket); 
  socketEventsListers.connect(socket); 
  socketEventsListers.list(socket); 
  socketEventsListers.saveFtp(socket); 
  socketEventsListers.getStoredServers(socket); 
  socketEventsListers.addToDownloadList(socket); 
  socketEventsListers.initDownloadList(socket); 
  socketEventsListers.addToScannerList(socket); 
  socketEventsListers.initScannerList(socket); 
  socketEventsListers.initScannerResultList(socket); 
  socketEventsListers.initTvShowList(socket); 
  socketEventsListers.scanFtp(socket); 
  socketEventsListers.bindOfflineOnlineTvShow(socket); 
  socketEventsListers.initLostEpisodesList(socket); 
  socketEventsListers.checkEpisodes(socket); 
  socketEventsListers.initDownload(socket); 
  socketEventsListers.initConfig(socket); 
  socketEventsListers.saveConfig(socket);
  socketEventsListers.checkTvShow(socket); 
  socketEventsListers.deleteDownloadItem(socket); 
  socketEventsListers.initConfigFiles(socket); 
  socket.on('disconnect', socketEventsListers.resetSessionSocket)
});