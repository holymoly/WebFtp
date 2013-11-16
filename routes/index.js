
/*
 * GET home page.
 */
var ftpData = require('../storedFtp.json');

exports.index = function(req, res){
  res.render('index', { title: 'WebFtp' });
};