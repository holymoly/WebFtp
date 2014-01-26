
/*
 * GET users listing.
 */

exports.downloadList = function(req, res){
  res.render('downloadList', { title: 'WebFtp' });
};

exports.scanner = function(req, res){
  res.render('scanner', { title: 'WebFtp' });
};

exports.tvShows = function(req, res){
  res.render('tvShows', { title: 'WebFtp' });
};

exports.lostEpisodes = function(req, res){
  res.render('lostEpisodes', { title: 'WebFtp' });
};

exports.config = function(req, res){
  res.render('config', { title: 'WebFtp' });
};