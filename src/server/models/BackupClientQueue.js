/**
 * BackupClientQueue
 * 
 * (Some code shared from Group)
 */

"use strict";

var conf = global.conf;

var BackupClientQueue = function() {
    this.maxOutTrayWaitTime = conf.backupClient.callConfirmTimeoutMs;

    this.id = require('crypto').randomBytes(16).toString('hex');
    this.queue = [];

    /** Client about to be transferred to pool pending confirmation, waiting in the out tray */
    this.clientOutTray;
    this.wipeClientOutTray();
};

/**
 * @param {Client} client
 */
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

/**
 * @param {Client} client
 * 
 * @return {Client} Client that was removed
 */
BackupClientQueue.prototype.removeClient = function(client) {
    var clientIndex = this.queue.indexOf(client);

    if (clientIndex > -1) {
        var removedClient = this.queue.splice(clientIndex, 1)[0];
        
        if (this.clientOutTray && this.clientOutTray.client === client) {
            this.wipeClientOutTray();
        }

        client.getSocket().leave(this.id);
        this.broadcastUpdate();

        return removedClient;
    }

}

/**
 * @param {string} event
 * @param {Object} data
 */
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

/**
 * @param {string} username
 */
BackupClientQueue.prototype.isUsernameLoggedIn = function(username) {
    var arr = this.queue;
    for (var i = 0; i < arr.length; ++i) {
        var client = arr[i];
        if (arr[i].username === username) {
            return true;
        }
    }
    
    return false;
}

/**
 * @return {number}
 */
BackupClientQueue.prototype.getQueueSize = function() {
    return this.queue.length;
}

/**
 * Removes any client waiting in the out tray.
 */
BackupClientQueue.prototype.wipeClientOutTray = function() {
    this.setClientOutTray();    // Both parameters undefined
}

/**
 * @param {Client} client
 * @param {ClientAnswerPool} pool
 */
BackupClientQueue.prototype.setClientOutTray = function(client, pool) {
    this.clientOutTray = {
        client: client,
        pool: pool,
        timestamp: Date.now()
    };
}

/**
 * @return {boolean} Whether a client is waiting in the out tray for transfer
 */
BackupClientQueue.prototype.isClientWaitingInOutTray = function() {
    if (this.clientOutTray && this.clientOutTray.client) {
        // Stale client in out tray needs to be ejected/logged out
        if ((this.clientOutTray.timestamp + this.maxOutTrayWaitTime) < Date.now()) {
            var client = this.removeClient(this.clientOutTray.client);

            client.getSocket().emit("backupClientEjected");

            return false;
        }

        return true;
    }

    return false;
}

/**
 * @param {ClientAnswerPool} clientAnswerPool
 * @return {boolean} Whether a client is waiting in the out tray for transfer
 */
BackupClientQueue.prototype.attemptTransferBackupClientToClientPool = function(clientAnswerPool) {
    // Don't do anything if there is already someone waiting to be transferred
    if (this.isClientWaitingInOutTray()) {
        return true;
    }

    if (this.getQueueSize() > 0) {
        var client = this.queue[0];
        
        this.setClientOutTray(client, clientAnswerPool);
        client.getSocket().emit("backupClientTransferCall");
        
        return true;
    }

    return false;   // We couldn't do the transfer because we don't have anyone
}

/**
 * Moves whichever client that is in the out tray to the client pool.
 */
BackupClientQueue.prototype.moveOutTrayClientToClientPool = function() {
    var client = this.clientOutTray.client;
    var pool = this.clientOutTray.pool;

    this.removeClient(client);
    pool.addClient(client);

    // Moved clients leave the queue (and join back in after chat if necessary)
    client.getSocket().leave(this.id);
}


module.exports = BackupClientQueue;