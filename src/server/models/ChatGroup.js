"use strict";

var Group = require("./Group");
var Client = require("./client");

/**
 * ChatGroup
 * 
 * Inherits from Group.
 * 
 * Class for handling chat-room specific methods for MOOCchat chat sessions.
 */
var ChatGroup = function(clients) {
    Group.call(this, clients);

    this.log = [];
    this.clientsQueuedToQuit = [];

    this.notifyEveryoneOnJoin();
}

// ChatGroup extends Group
ChatGroup.prototype = Object.create(Group.prototype);

/**
 * @param {Client} fromClient
 * @param {string} message
 */
ChatGroup.prototype.broadcastMessage = function(fromClient, message) {
    var messageObj = {
        screenName: this.getScreenName(fromClient),
        clientIndex: this.getClientIndex(fromClient),
        message: message,
        timestamp: Date.now()
    }

    this.broadcastEvent("chatGroupMessage", messageObj);

    // Add client reference to the message object that is stored to the log
    messageObj.client = fromClient;

    this.log.push(messageObj);

}

/**
 * Determines if the discussion is to be terminated because everyone would like to quit.
 * 
 * @return {boolean} Whether termination occurred
 */
ChatGroup.prototype.terminationCheck = function() {
    if (this.numberOfClientsQueuedToQuit() === this.numberOfClients()) {
        this.terminate();
        return true;
    }

    return false;
}

/**
 * Fires a termination socket event to all clients.
 * **Not intended to be use directly** - use #terminationCheck().
 * 
 * Actual "termination" doesn't really happen here:
 *  - clients are expected to move on;
 *  - server is expected to remove reference to this ChatGroup
 *    object once it detects that termination occurred via
 *    #terminationCheck().
 */
ChatGroup.prototype.terminate = function() {
    this.broadcastEvent("chatGroupTerminated", {
        groupId: this.id
    });
}

/**
 * Broadcasts a socket event to let all clients know that a client has
 * changed their request to quit.
 */
ChatGroup.prototype.broadcastQuitChange = function(client, quitStatus) {
    this.broadcastEvent("chatGroupQuitChange", {
        groupId: this.id,
        groupSize: this.numberOfClients(),
        quitQueueSize: this.numberOfClientsQueuedToQuit(),

        screenName: this.getScreenName(client),
        quitStatus: quitStatus
    });
}

/**
 * @param {Client} client
 */
ChatGroup.prototype.queueClientToQuit = function(client) {
    if (this.clientsQueuedToQuit.indexOf(client) < 0) {
        this.clientsQueuedToQuit.push(client);
    }
    
    this.broadcastQuitChange(client, true);
}

/**
 * @param {Client} client
 */
ChatGroup.prototype.unqueueClientToQuit = function(client) {
    var clientIndex = this.clientsQueuedToQuit.indexOf(client);
    if (clientIndex > -1) {
        this.clientsQueuedToQuit.splice(clientIndex, 1);
    }

    this.broadcastQuitChange(client, false);
}

/**
 * @return {number}
 */
ChatGroup.prototype.numberOfClientsQueuedToQuit = function() {
    return this.clientsQueuedToQuit.length;
}

/**
 * @param {Client} client
 * @return {string}
 */
ChatGroup.prototype.getScreenName = function(client) {
    return "Student " + (this.getClientIndex(client) + 1);
}

/**
 * Backwards compatibility
 * Returns object array that previously was used with probAnswers.
 * 
 * @return {Object[]}
 */
ChatGroup.prototype.getGroupProbAnswerObjArray = function() {
    return this.clients.map(function(client) {
        return {
            screenName: this.getScreenName(client),
            clientIndex: this.getClientIndex(client),
            answer: client.probingQuestionAnswer,
            justification: client.probJustification
        }
    }, this);
}

/**
 * Notifies all members of a chat group formation.
 * Intended to be used on initial formation only.
 */
ChatGroup.prototype.notifyEveryoneOnJoin = function() {
    this.clients.forEach(function(client) {
        this.emitEvent(client, "chatGroupFormed", {
            groupId: this.id,
            groupSize: this.numberOfClients(),
            groupAnswers: this.getGroupProbAnswerObjArray(),
            screenName: this.getScreenName(client),
            clientIndex: this.getClientIndex(client)
        });
    }, this);
}

/**
 * Adds a new client to the chat group.
 * Intended for MOOCchat parties that are not present at
 * the time of the initial formation, such as an instructor.
 * 
 * @param {Client} client
 */
ChatGroup.prototype.addClient = function(client) {
    Group.prototype.addClient.call(this, client);

    // TODO: Broadcast chatGroupClientJoined socket event
    // this.broadcastEvent("chatGroupClientJoined", {
    //     groupId: this.id,
    //     groupSize: this.numberOfClients()
    //     // ???
    // });
}

/**
 * @param {Client} client
 */
ChatGroup.prototype.removeClient = function(client) {
    this.queueClientToQuit(client);

    Group.prototype.removeClient.call(this, client);

    // Need to remove the client out of the queue to quit because it shouldn't exist anymore
    var clientIndex = this.clientsQueuedToQuit.indexOf(client);
    if (clientIndex > -1){
        this.clientsQueuedToQuit.splice(clientIndex, 1);
    }
}

module.exports = ChatGroup;
