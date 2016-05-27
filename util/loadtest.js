/**
 * Loadtests the websocket connection to moocchat
 */


var SERVER = "localhost:8080";
var url = "http://" + SERVER;

var io = require('socket.io-client');

var connectedCount = 0;
// The total number of websocket connections to make
var totalCount = 2000;

var sockets = [];

function disconnectAll() {
    for (var i = 0; i < totalCount; i++) {
        //console.log("Closing socket " + i);
        sockets[i].disconnect();
    }
    console.log("All sockets closed");
}

/**
 * Creates a new socket
 */
function createNewSocket(name) {
    var socket = io.connect(url);
    socket.transport = 'websocket';

    socket.on('error', function(error) {
        console.log(error);
    });

    socket.on('connect', function() {
        connectedCount++;
        console.log("[" + connectedCount + "/" + totalCount + "]: Socket " + name + " connected");
        socket.emit('login_req', {username: "test2", password: "ischool"});
        
        if (connectedCount == totalCount) {
            disconnectAll();
        }
    });

    return socket;
}


for (var i = 0; i < totalCount; i++) {
    console.log("Creating socket " + i);
    sockets.push(createNewSocket(i));
}
