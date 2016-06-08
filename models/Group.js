/**
 * Group
 * 
 * Class for organising MOOCchat clients (see /models/client) into "groups".
 * Does not handle MOOCchat chat-specific tasks such as messaging or screen naming.
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
            let clientSocket = client.getSocket();
            
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
    addClients(clients) {
        clients.forEach(function(client) {
            this.addClient(client);
        }, this);
    }
    
    /**
     * @param {Client} client
     */
    removeClient(client) {
        let clientIndex = this.getClientIndex(client);
        if (clientIndex > -1) {
            this.clients.splice(clientIndex, 1);
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
        let clientSocket = client.getSocket();
        
        if (!clientSocket) {
            throw new Error("Client socket not found");
        }
        
        clientSocket.emit(event, data);
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