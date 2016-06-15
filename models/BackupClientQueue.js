/**
 * BackupClientQueue
 * 
 * (Some code shared from Group)
 */

"use strict";

var io = global.io;

var Client = require("./client");

var BackupClientQueue = function() {
    this.id = require('crypto').randomBytes(16).toString('hex');
    this.queue = [];
};

BackupClientQueue.prototype.addClient = function(client) {
    if (this.queue.indexOf(client) < 0) {
        var clientSocket = client.getSocket();

        if (!clientSocket) {
            throw new Error("Client must have active socket");
        }

        // Join client socket into the same "room" as this group using the group ID
        clientSocket.join(this.id);

        this.queue.push(client);
        this.broadcastUpdate();
    }
}

BackupClientQueue.prototype.removeClient = function(client) {
    var clientIndex = this.queue.indexOf(client);

    if (clientIndex > -1) {
        this.queue.splice(clientIndex, 1);
        client.getSocket().leave(this.id);
        this.broadcastUpdate();
    }

}

BackupClientQueue.prototype.popClient = function() {
    var client = this.queue.shift();

    if (client) {
        // Popped clients leave the queue (and join back in after chat if necessary)
        client.getSocket().leave(this.id);
    }

    return client;
}

BackupClientQueue.prototype.broadcastEvent = function(event, data) {
    io.sockets.in(this.id).emit(event, data);
}

BackupClientQueue.prototype.broadcastUpdate = function() {
    var data = {
        clients: this.queue.map(function(client) {
            return {
                username: client.username
            }
        })
    }

    this.broadcastEvent("backupClientQueueUpdate", data);
}

BackupClientQueue.prototype.getClientFromUsername = function(username) {
    var arr = this.queue;
    for (var i = 0; i < arr.length; ++i) {
        var client = arr[i];
        if (arr[i].username === username) {
            return client;
        }
    }
}

module.exports = BackupClientQueue;