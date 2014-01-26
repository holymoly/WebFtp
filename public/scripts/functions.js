var socket = io.connect();

function initCounter(){
  // Send Type and ftp path to WebServer
  socket.emit('addToDownloadList', {type: 'init' ,path: 'none'});
  socket.emit('addToScannerList', {type: 'init' ,path: 'none'});
};

function initScanner(){
  // Send Type and ftp path to WebServer
  initCounter();
  initScannerList();
};

function initTvShows(){
  // Send Type and ftp path to WebServer
  initCounter();
  socket.emit('initTvShowList');
};

// Triggers the init of the downloadlist
function initDownloadList(){
  initCounter();
  socket.emit('initDownloadList');
};

//Init scanner List with items
function initScannerList(){
  socket.emit('initScannerList');
  socket.emit('initScannerResultList');
};

//Init scanner List with items
function initEpisodes(){
  initCounter();
  socket.emit('initLostEpisodesList');
};

//Init scanner List with items
function initConfig(){
  initCounter();
  socket.emit('initConfig');
};

// Triggers the Connect of the server
function connect(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('connect', {ftpUrl: ftpUrl ,
                          ftpPort: ftpPort, 
                          ftpUser: ftpUser, 
                          ftpPass: ftpPass, 
                          ftpTls: ftpTls });
};

// Triggers the login save of the server
function saveFtp(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('saveFtp', {ftpUrl: ftpUrl ,
                          ftpPort: ftpPort, 
                          ftpUser: ftpUser, 
                          ftpPass: ftpPass, 
                          ftpTls: ftpTls });
};

// Triggers the configuration save
function saveConfig(){
  var pathTvShows = document.getElementById('textTvShowPath').value;
  var pathDownloads = document.getElementById('textDownloadPath').value;
  var downloadList = document.getElementById('textDownloadList').value;
  var dumpFile = document.getElementById('textDumpFile').value;     
  var matchedTvShows = document.getElementById('textMatchedTvShows').value;
  var scannerList = document.getElementById('textScannerList').value;  
  var storedFtp = document.getElementById('textStoredFtp').value;  

  console.log('save');
  socket.emit('saveConfig', { pathTvShows: pathTvShows,
                              pathDownloads: pathDownloads ,
                              downloadList : downloadList,
                              dumpFile : dumpFile,
                              matchedTvShows : matchedTvShows,
                              scannerList : scannerList,
                              storedFtp : storedFtp
                            });
};

// Triggers the configuration save
function initConfigFiles(){

  var downloadList = document.getElementById('textDownloadList').value;
  var dumpFile = document.getElementById('textDumpFile').value;     
  var matchedTvShows = document.getElementById('textMatchedTvShows').value;
  var scannerList = document.getElementById('textScannerList').value;  
  var storedFtp = document.getElementById('textStoredFtp').value;  

  console.log('Create config files');
  socket.emit('initConfigFiles', {downloadList : downloadList,
                                  dumpFile : dumpFile,
                                  matchedTvShows : matchedTvShows,
                                  scannerList : scannerList,
                                  storedFtp : storedFtp
                                });
};

// Get stored servers
function getStoredServers(){
  socket.emit('getStoredServers');
};

// Triggers filling of connection data
function fillData(data){
  //console.log(data.dataset);
  document.getElementById('textFtpUrl').value = data.dataset.ftpurl;
  document.getElementById('textPort').value = data.dataset.ftpport;
  document.getElementById('textUser').value = data.dataset.ftpuser;
  document.getElementById('textPass').value = data.dataset.ftppass;
  if (data.dataset.ftptls === 'true'){
    document.getElementById('chkTls').checked = true;
  }
  else{ 
    document.getElementById('chkTls').checked = false;
  }
};

//Waiting for available servers
socket.on('receiveStoredServers', function(data){
 
  //console.log(data);
  Items= data;
  //Remove existing nodes to clear Dropdown
  var select = document.getElementById('foundedServers');
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }
  for (var i = 0; i < Items.length; i++){
    //create list item
    var li = document.createElement('li');
    //create anchor and text
    var a = document.createElement('a');
    //console.log(Items[i]);
    a.setAttribute('data-ftpUrl', Items[i].ftpUrl);
    a.innerHTML = Items[i].ftpUrl;
    a.setAttribute('data-ftpPort', Items[i].ftpPort);
    a.setAttribute('data-ftpTls', Items[i].ftpTls);
    a.setAttribute('data-ftpUser', Items[i].ftpUser);
    a.setAttribute('data-ftpPass', Items[i].ftpPass);
    a.setAttribute('onclick', 'fillData(this)');
    // build element which will be added to the button
    li.appendChild(a);

    select.appendChild(li);
  }
});

//Receiving Initial folder 
socket.on('initialFolderFtp', function(data){

  Items = data;

  var ul = document.createElement('ul');
  ul.setAttribute('id', 'RootFtpFolder');

  var li = document.createElement('li');
  li.setAttribute('class', 'parent_li');
  li.setAttribute('id', '/');

  var div = document.createElement('div');
  div.setAttribute('class', 'glyphicon glyphicon-folder-open');
  div.innerHTML = div.innerHTML + ' ' + document.getElementById('textFtpUrl').value;
  
  var span = document.createElement('span');  
  span.setAttribute('onclick', 'checkSubfolders(this)');
  span.setAttribute('data-name', '/');

  span.appendChild(div);
  
  li.appendChild(span);
  ul.appendChild(li);
  document.getElementById('treeSection').appendChild(ul);  
});

//Receiving Initial folder
socket.on('setSubfolders', function(path,data){

  Items = data;

  //console.log(data);
  for (var i = 0; i < Items.length; i++){
    //check if folder
    if (Items[i].type === 'd'|| Items[i].type ==='-'|| Items[i].type ==='l'){
      var ul = document.createElement('ul');
      var li = document.createElement('li');
      var span = document.createElement('span'); 
      var div = document.createElement('div'); 
  
      li.setAttribute('id', path + '/' +  Items[i].name);

      if (Items[i].type === 'd'){
        div.setAttribute('class', 'glyphicon glyphicon-folder-open');
        span.setAttribute('onclick', 'checkSubfolders(this)');
        li.setAttribute('data-type', 'folder');
      }
      if (Items[i].type === '-'){
        div.setAttribute('class', 'glyphicon glyphicon-file');
        li.setAttribute('data-type', 'file');
      }

      div.innerHTML = div.innerHTML + ' ' + Items[i].name;

      span.appendChild(div);
      span.setAttribute('data-name', path + '/' +  Items[i].name);

      li.setAttribute('draggable', 'true');
      li.setAttribute('ondragstart', 'drag(event)');
      li.appendChild(span);

      ul.appendChild(li);
    
      document.getElementById(path).appendChild(ul);
    }
  }
});

//Receiving and updatimg count of download list items
socket.on('updateCountDownloadList', function(data){
  counterHtml = document.getElementById('listCounterDownload');
  counterHtml.innerHTML = data;
});

//Receiving and updatimg count of scanner list items
socket.on('updateCountScannerList', function(data){
  counterHtml = document.getElementById('listCounterScanner');
  counterHtml.innerHTML = data;
});

//Receiving and updatimg downloadlist items
socket.on('updateDownloadList', function(data){
  var root = document.getElementById('downloadItemList');
  root.innerHTML = '';
  //console.log(data);
  data.forEach(function(item){
    var li = document.createElement('li');
    li.setAttribute('class', 'wordwrap');
    li.setAttribute('id', item.path);
    li.setAttribute('data-type','downloadItem');
    li.setAttribute('draggable', 'true');
    li.setAttribute('ondragstart', 'drag(event)');
    li.innerHTML = li.innerHTML + ' ' + item.path;

    root.appendChild(li);  
  });
});

// Hide Show or Get Subfolders
function checkSubfolders(data){

  var parentNode = data.parentNode;
  var childs = parentNode.childNodes;

  //If one ask ftp for subfolders
  if (childs.length <= 2){
    socket.emit('list',data.dataset.name);
  }else{
    //hide or show subfolders
    for(i=0; i < childs.length; i++)
    {
      if(childs[i].nodeName === 'UL'){
        if(childs[i].style.display === 'none'){
          childs[i].style.display = 'block';
        }
        else{
          childs[i].style.display = 'none';
        }
      }
    }
  }
};

//Drag starts
function drag(ev) {
  //console.log(ev.target.id);
  ev.dataTransfer.setData("Text",ev.target.id);
}

//Drop finished for Download list
function dropDownload(ev){
  console.log('init');
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Text");
  
  var source = document.getElementById(data);

  console.log('Source: ' + source);
  source.removeAttribute('draggable');
  source.removeAttribute('ondragstart');
  var childs = source.childNodes;
  for(i=0; i < childs.length; i++)
    {
    console.log(childs[i].nodeName);
    if(childs[i].nodeName === 'SPAN'){
      childs[i].removeAttribute('onclick');
    }
    if(childs[i].nodeName === 'UL'){
      source.removeChild(childs[i]);
    }
  }
  // Send Type and ftp path to WebServer
  socket.emit('addToDownloadList', {type: source.dataset.type,
                                    path: source.id
                                    });
}

//Drop finished for trash
function dropTrash(ev){
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Text");
  var source = document.getElementById(data);
  console.log(source.id);
  // Send item to be deleted
  socket.emit('deleteDownloadItem', { path: source.id });
}

//Drop finished for Scanner list
function dropScanner(ev){
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Text");
  
  var source = document.getElementById(data);
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpUser = document.getElementById('textUser').value;

  console.log('Source: ' + source);
  source.removeAttribute('draggable');
  source.removeAttribute('ondragstart');
  var childs = source.childNodes;
  for(i=0; i < childs.length; i++)
    {
    console.log(childs[i].nodeName);
    if(childs[i].nodeName === 'SPAN'){
      childs[i].removeAttribute('onclick');
    }
    if(childs[i].nodeName === 'UL'){
      source.removeChild(childs[i]);
    }
  }
  if(source.dataset.type === 'folder'){
    // Send Type and ftp path to WebServer
    socket.emit('addToScannerList', { path: source.id,
                                      ftpUrl: ftpUrl,
                                      ftpUser: ftpUser});
  }
}

//allow drop
function allowDrop(ev){
  ev.preventDefault();
}

//Showing Paths to scan 
socket.on('initialScannerFolder', function(data){

  Items = data;

  var ul = document.createElement('ul');

  for(i=0; i < Items.length; i++){
    var li = document.createElement('li');

    var div = document.createElement('div');
    div.setAttribute('class', 'glyphicon glyphicon-folder-open');
    div.innerHTML = div.innerHTML + ' ' + Items[i].path;
    
    var span = document.createElement('span'); 

    span.appendChild(div);
    
    li.appendChild(span);
    ul.appendChild(li);
  }
  document.getElementById('treeScanPaths').appendChild(ul);  
});

//Showing results of scan 
socket.on('initialScannerResultList', function(data){

  var div = document.createElement('div');
  div.setAttribute('class', 'wordwrap');
  div.innerHTML = data;
  
  document.getElementById('treeScanResults').appendChild(div);  
});

//Start scanning of FTP
function scanFtp(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('scanFtp', {ftpUrl: ftpUrl ,
                          ftpPort: ftpPort, 
                          ftpUser: ftpUser, 
                          ftpPass: ftpPass, 
                          ftpTls: ftpTls });
}

//Showing Tv Shows
socket.on('initialTvShowResultList', function(data){
  //console.log(data);
  var originname = data;
  data = data.replace(/\./g,' ');
  var li = document.createElement('li');

  var div = document.createElement('div');
  div.setAttribute('class', 'glyphicon glyphicon-film');
  div.setAttribute('onclick', 'checkTvShow(this)');
  div.setAttribute('data-name', data);
  div.setAttribute('data-originname', originname);
  div.setAttribute('ondrop', 'dropTvShowMatch(event)');
  div.setAttribute('ondragover','allowDrop(event)');
  div.setAttribute('id',  originname);
  div.innerHTML = div.innerHTML + ' ' + data;
  
  var span = document.createElement('span'); 

  span.appendChild(div);
  
  li.appendChild(span);
  document.getElementById('TvShowTreeList').appendChild(li);  
});

//Check Tv Show on TheTvDb
function checkTvShow(data){
  
  if (data !== 'manual'){
    socket.emit('checkTvShow', {name: data.dataset.name , originname: data.dataset.originname });
  }else{
    //console.log('manual');
    var passOn = document.getElementById('textManualTvShowInput');
    
    socket.emit('checkTvShow', {name: passOn.value , originname: passOn.dataset.originname });
  }
  //console.log(data.dataset.originName)
}

//Showing Tv Shows
socket.on('TvShowResultList', function(data, originname){
  var root = document.getElementById('TvShowResultTree');
  root.innerHTML = '';
  if (data[0].SeriesName !== 'not found'){
    
    var ul = document.createElement('ul');
    //console.log(data.length);
    for(i=0; i < data.length; i++){
    //data.forEach(function (item){
      var li = document.createElement('li');

      var div = document.createElement('div');
      div.setAttribute('draggable', 'true');
      div.setAttribute('ondragstart', 'drag(event)');
      div.setAttribute('data-originName', originname);
      div.setAttribute('data-seriesid', data[i].seriesid);
      div.setAttribute('data-language', data[i].language);
      div.setAttribute('data-SeriesName',data[i]. SeriesName);
      div.setAttribute('data-banner', data[i].banner);
      div.setAttribute('data-FirstAired', data[i].FirstAired);
      div.setAttribute('data-Network', data[i].Network);
      div.setAttribute('data-IMDB_ID', data[i].IMDB_ID);
      div.setAttribute('data-id', data[i].id);
      div.setAttribute('data-Overview', data[i].Overview);
      div.setAttribute('title', 'First aired: ' + data[i].FirstAired + '\r' + 'Overview: ' + data[i].Overview);
      div.setAttribute('id',  data[i].seriesid);
      div.innerHTML = div.innerHTML + ' ' + data[i].SeriesName;
      
      var span = document.createElement('span'); 

      span.appendChild(div);
      
      li.appendChild(span);

      ul.appendChild(li);
    }
    //document.getElementById('TvShowResultTree').removeChild(0);
    root.appendChild(ul);  
  }else{
    var input = document.createElement('input');
    var button = document.createElement('input');

    input.setAttribute('class','form-control');
    input.setAttribute('id','textManualTvShowInput');
    input.setAttribute('placeholder','not found, type in Tv Show Name');
    input.setAttribute('data-originname', originname);

    button.setAttribute('class','btn btn-block btn-primary');
    button.setAttribute('value','Search manual');
    button.setAttribute('onclick', 'checkTvShow("manual")');
    button.innerHTML = button.innerHTML + 'Search manual';

    root.appendChild(input);
    root.appendChild(button);
  }
});

//Drop finished for Tv Show off/online match
function dropTvShowMatch(ev){
  //console.log('Match');
  
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Text");
  //console.log(data);
  
  var source = document.getElementById(data);
  //onsole.log(source.dataset.originname);
  
  // Send Type and ftp path to WebServer
  socket.emit('bindOfflineOnlineTvShow', {originname: source.dataset.originname,
                                          seriesid: source.dataset.seriesid
                                          });
}

//Mark Matched TvShow
socket.on('markMatchedTvShow', function(data){
  
  var div = document.getElementById(data);
  div.parentNode.style.backgroundColor = 'green';
  //console.log(div);
});

//Showing Tv Shows
socket.on('initialLostEpisodesList', function(data){
  //console.log(data);
  var originname = data.originname;
  var name = data.originname.replace(/\./g,' ');
  var li = document.createElement('li');

  var div = document.createElement('div');
  div.setAttribute('class', 'glyphicon glyphicon-film');
  div.setAttribute('onclick', 'checkEpisodes(this)');
  div.setAttribute('data-name', name);
  div.setAttribute('data-originname', originname);
  div.setAttribute('data-seriesid',  data.seriesid);
  div.setAttribute('id',  originname);
  div.innerHTML = div.innerHTML + ' ' + name;
  
  var span = document.createElement('span'); 

  span.appendChild(div);
  
  li.appendChild(span);
  document.getElementById('TvShowTreeList').appendChild(li);  
});

//Check Tv Show on TheTvDb
function checkEpisodes(data){
  //clear available episodes list
  var root = document.getElementById('availableEpisodesList');
  root.innerHTML = '';
  socket.emit('checkEpisodes', { 'seriesid': data.dataset.seriesid, 'name': data.dataset.name , 'originname': data.dataset.originname });
  console.log(data.dataset)
}

//Receiving missing episodes
socket.on('lostEpisodes', function(data){
  var root = document.getElementById('LostEpisodesList');
    root.innerHTML = '';
    var ul = document.createElement('ul');

    for(i=0; i < data.length; i++){
      //data.forEach(function (item){
      var li = document.createElement('li');
      var div = document.createElement('div');
      div.innerHTML = div.innerHTML + ' ' + data[i];
      var span = document.createElement('span'); 
      span.appendChild(div);     
      li.appendChild(span);
      ul.appendChild(li);
    }
    //document.getElementById('TvShowResultTree').removeChild(0);
    root.appendChild(ul);  
});

//Receiving founded episodes
socket.on('foundedEpisode', function(data){
  var root = document.getElementById('availableEpisodesList');
  var li = document.createElement('li');
  li.setAttribute('class', 'wordwrap');
  li.setAttribute('draggable', 'true');
  li.setAttribute('ondragstart', 'drag(event)');
  li.setAttribute('data-type', 'folder');
  li.setAttribute('id', data);
  li.innerHTML = li.innerHTML + ' ' + data;

  root.appendChild(li);  
});

// Triggers to download the Download List of the server
function initDownload(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('initDownload', {ftpUrl: ftpUrl ,ftpPort: ftpPort, ftpUser: ftpUser, ftpPass: ftpPass, ftpTls: ftpTls });
};

//Receiving configuration data
socket.on('initialConfig', function(data){
  document.getElementById('textTvShowPath').value = data.pathTvShows;
  document.getElementById('textDownloadPath').value = data.pathDownloads;
  document.getElementById('textDownloadList').value = data.downloadList;
  document.getElementById('textDumpFile').value = data.dumpFile;
  document.getElementById('textMatchedTvShows').value = data.matchedTvShows;
  document.getElementById('textScannerList').value = data.scannerList;
  document.getElementById('textStoredFtp').value = data.storedFtp;
});

//Receiving and updatimg count of download list items
socket.on('indicator', function(data){
  console.log(data);
   document.getElementById(data.type).hidden = data.hidden;
});