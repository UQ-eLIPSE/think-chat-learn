/**
 * Group
 * 
 * Class for organising MOOCchat clients (see /models/client) into "groups".
 * Does not handle MOOCchat chat-specific tasks such as messaging or screen naming.
 */

"use strict";

var io = global.io;

var Client = require("./client");

/**
 * @param {Client[]} clients
 */
var Group = function(clients) {
    this.id = require('crypto').randomBytes(16).toString('hex');    // {string}
    this.clients = [];  // {Client[]}

    if (clients) {
        this.addClients(clients);
    }
}

/**
 * @param {Client} client
 */
Group.prototype.addClient = function(client) {
    if (this.clients.indexOf(client) < 0) {
        var clientSocket = client.getSocket();

        if (!clientSocket) {
            throw new Error("Client must have active socket");
        }

        // Join client socket into the same "room" as this group using the group ID
        clientSocket.join(this.id);

        this.clients.push(client);
    }
}

/**
 * @param {Client[]} clients
 */
Group.prototype.addClients = function(clients) {
    clients.forEach(function(client) {
        this.addClient(client);
    }, this);
}

/**
 * @param {Client} client
 */
Group.prototype.removeClient = function(client) {
    var clientIndex = this.getClientIndex(client);
    if (clientIndex > -1) {
        this.clients.splice(clientIndex, 1);
        client.getSocket().leave(this.id);
    }
}

Group.prototype.removeAllClients = function() {
    this.clients.forEach(this.removeClient, this);
}

/**
 * @param {string} event Event name/ID of the socket event
 * @param {any} data Data to pass with the frame
 */
Group.prototype.broadcastEvent = function(event, data) {
    io.sockets.in(this.id).emit(event, data);
}

/**
 * @param {Client} client
 * @param {string} event
 * @param {any} data
 */
Group.prototype.emitEvent = function(client, event, data) {
    var clientSocket = client.getSocket();

    if (!clientSocket) {
        throw new Error("Client socket not found");
    }

    clientSocket.emit(event, data);
}

/**
 * @return {number}
 */
Group.prototype.numberOfClients = function() {
    return this.clients.length;
}

/**
 * @param {Client} client
 * @return {number} The index of the client in the group
 */
Group.prototype.getClientIndex = function(client) {
    return this.clients.indexOf(client);
}

module.exports = Group;