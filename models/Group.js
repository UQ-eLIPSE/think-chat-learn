/**
 * Group
 */

"use strict";

const io = global.io;

const Client = require("./client"); 

class Group {
    /**
     * @param {Client} client
     */
    addClient(client) {
        if (this.clients.indexOf(client) < 0) {
            this.clients.push(client);
            
            // TODO: Need to make `client` more OO-like and handle joining rooms as
            // we don't actually know where the socket ID comes from at this point
            // io.sockets.connected[client.socketID].join(this.id);
            client.getSocket().join(this.id);
        }
    }
    
    /**
     * @param {Client[]} clients
     */
    addClients(clients) {
        clients.forEach(function(client) {
            this.addClient(client);
        }, this);
    }
    
    /**
     * @param {Client} client
     */
    removeClient(client) {
        if (this.clients.indexOf(client) > -1) {
            this.clients.splice(this.clients.indexOf(client), 1);
            
            // TODO: Need to make `client` more OO-like and handle joining rooms as
            // we don't actually know where the socket ID comes from at this point
            // io.sockets.connected[client.socketID].leave(this.id);
            client.getSocket().leave(this.id);
        }   
    }
    
    removeAllClients() {
        this.clients.forEach(this.removeClient, this);
    }
    
    /**
     * @param {string} event Event name/ID of the socket event
     * @param {any} data Data to pass with the frame
     */
    broadcastEvent(event, data) {
        io.sockets.in(this.id).emit(event, data);
    }
    
    /**
     * @param {Client} client
     * @param {string} event
     * @param {any} data
     */
    emitEvent(client, event, data) {
        if (!client.socket) {
            throw new Error("Client socket not found");
        }
        
        client.socket.emit(event, data);
    }
    
    /**
     * @return {number}
     */
    numberOfClients() {
        return this.clients.length;
    }
    
    /**
     * @param {Client} client
     * @return {number} The index of the client in the group
     */
    getClientIndex(client) {
        return this.clients.indexOf(client);
    }
    
    /**
     * @param {Client[]} clients
     */
    constructor(clients) {
        this.id = require('crypto').randomBytes(16).toString('hex');    // {string}
        this.clients = [];  // {Client[]}
        
        if (clients) {
            this.addClients(clients);
        }
    }
}

module.exports = Group;