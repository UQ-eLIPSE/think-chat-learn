// Synchronously load server URL
jQuery.ajax({async:false, type:'GET', url:'js/settings.server.js', data:null, dataType:'script'});

function connect() {
  var socket = io.connect(SERVER);
  socket.transport = 'websocket';
  socket.on('error', function (message) { 
    alert("The server for this task is currently unavailable. It may be currently offline for maintenance. Please try again later.");
    console.log("ERR:[%s] %s", SERVER, message);
  });
  console.log("INF:[%s] connected", SERVER);
  return socket;
}
