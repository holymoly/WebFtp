
/**
 * Module dependencies.
 */

var express = require('express');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var socketEventsListers = require('./routes/socket');
// express middleware
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler')
var methodOverride = require('method-override')

var app = express();
var router = express.Router();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(favicon());
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

router.get('/', user.index);
router.get('/downloadList', user.downloadList);
router.get('/scanner', user.scanner);
router.get('/tvShows', user.tvShows);
router.get('/lostEpisodes', user.lostEpisodes);
router.get('/config', user.config);
app.use(router);

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
  socketEventsListers.setSessionSocket(socket,function(){
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
    socketEventsListers.discon(socket);
    socketEventsListers.error(socket);
  });

  socket.on('disconnect', socketEventsListers.resetSessionSocket)
});
