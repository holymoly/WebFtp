var socket = io.connect();

// Triggers the Connect of the server
function connect(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('connect', {ftpUrl: ftpUrl ,ftpPort: ftpPort, ftpUser: ftpUser, ftpPass: ftpPass, ftpTls: ftpTls });
};

// Triggers the Connect of the server
function saveConfig(){
  var ftpUrl = document.getElementById('textFtpUrl').value;
  var ftpPort = document.getElementById('textPort').value;
  var ftpUser = document.getElementById('textUser').value;
  var ftpPass = document.getElementById('textPass').value;
  var ftpTls = document.getElementById('chkTls').value;

  socket.emit('saveConfig', {ftpUrl: ftpUrl ,ftpPort: ftpPort, ftpUser: ftpUser, ftpPass: ftpPass, ftpTls: ftpTls });
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
socket.on('initialFolder', function(data){

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
      li.setAttribute('class', 'parent_li');
      li.setAttribute('id', path + '/' +  Items[i].name);

      var span = document.createElement('span'); 
  
      var div = document.createElement('div'); 

      if (Items[i].type === 'd'){
        div.setAttribute('class', 'glyphicon glyphicon-folder-open');
        span.setAttribute('onclick', 'checkSubfolders(this)');
      }
      if (Items[i].type === '-'){
        div.setAttribute('class', 'glyphicon glyphicon-file');
      }

      div.innerHTML = div.innerHTML + ' ' + Items[i].name;

      span.appendChild(div);
      span.setAttribute('data-name', path + '/' +  Items[i].name);

      li.appendChild(span);

      ul.appendChild(li);
      ul.setAttribute('id', path + '/' +  Items[i].name + '/Entry');
      ul.setAttribute('draggable', 'true');
      ul.setAttribute('ondragstart', 'drag(event)');

      document.getElementById(path).appendChild(ul);
    }
  }
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
  console.log(ev.target.id);
  ev.dataTransfer.setData("Text",ev.target.id);
}

//Drop finished
function drop(ev){
  ev.preventDefault();
  var data = ev.dataTransfer.getData("Text");
  console.log('Source: ' + data);
  var source = document.getElementById(data);
  source.removeAttribute('draggable');
  source.removeAttribute('ondragstart');

  var LiChilds = source.childNodes;
  for(i=0; i < LiChilds.length; i++)
  {
    var SpanChilds = LiChilds[i].childNodes;
    for(y=0; y < SpanChilds.length; y++)
      {
      console.log(SpanChilds[y].nodeName);
      if(SpanChilds[y].nodeName === 'SPAN'){
        SpanChilds[y].removeAttribute('onclick');
      }
      if(SpanChilds[y].nodeName === 'UL'){
        LiChilds.removeChild(SpanChilds[i]);
      }
    }  
  }
  //console.log('Data: ' + ev.target)
  document.getElementById('downloadList').appendChild(source);
}

//allow drop
function allowDrop(ev){
  ev.preventDefault();
}