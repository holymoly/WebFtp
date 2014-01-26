
/*
 * Communication with postgres
 */

var pg = require('pg')
  , db = require('./db')
  , config = require('../config.json');

/*
  User related stuff
*/
// add one user entrie
exports.addUser = function(req, salt, hash, callback){
  
  client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database);
  client.connect();

  var query = client.query('INSERT INTO userdata (email,nick,salt,hash) VALUES ($1, $2, $3, $4)'
    , [req.body.Email, req.body.Nick, salt, hash],function(err){
    client.end();
    callback(err);
    });
};

// check if user exist and retrieve uid
exports.queryUid = function(nickname, callback){
  var uid = null;

  client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database );
  client.connect();

  var query = client.query('SELECT uid FROM userdata WHERE nick=$1', [nickname], function(err, result){
  //callback(err);
  //client.end();
    if(err){
      console.log(err);
    }else{
      if (result.rows.length==1){
        uid = result.rows[0].uid;
        console.log('User ' + nickname + ' found with uid ' + result.rows[0].uid);
      }
    }  
    callback(uid); 
  });
};

// get hash from user 
exports.queryHash = function(req,callback){
  client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database );
  client.connect();

  var query = client.query('SELECT hash, salt FROM userdata WHERE nick=$1', [req.body.Nick])
    , hash = new Array();

  query.on('row', function(row){
    hash.push({hash: row.hash, salt: row.salt});
  });

  query.on('end', function(){
    client.end();
    callback(hash);
  });

  query.on('error', function(error){
    console.log(error);
  });
};

/*
* Session related stuff
*/
// Add session and return sid. If sessions exists delete them and create a new entry
exports.createSession = function(uid, sid, callback){
    client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database);
    client.connect();
    
    var query = client.query('SELECT sid FROM sessiondata WHERE uid=$1', [uid], function(err, result){
    if(err){
      console.log(err);
    }else{
      if (result.rows.length==0){
        //Make new
        db.addSession(uid,sid, function(err){
          callback(sid);
          console.log(err);
        });
      }
      else{
        db.deleteSession(uid, function(err){
          db.addSession(uid,sid, function(err){
            callback(sid);
          });
        });
      }
    }  
  });
};

//Add session to database
exports.addSession = function(uid, sid, callback){
  client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database);
  client.connect();
  
  var query = client.query('INSERT INTO sessiondata (uid,sid) VALUES ($1, $2)', [uid, sid],function(err){
    console.log('Add session');
    console.log('UID: ' + uid);
    client.end();
    callback(err);
  });
};

//Delete session from database with given uid
exports.deleteSession = function(uid, callback){
  client = new pg.Client('postgres://' + config.User + ':' + config.Pass + '@' + config.DbIP + '/' + config.Database);
  client.connect();
  
  var query = client.query('DELETE FROM sessiondata WHERE uid = $1', [uid],function(err){
    console.log(err);
    client.end();
    callback(err);
  });
};



