"use strict";

const Group = require("./Group");
const Client = require("./client");

/**
 * ChatGroup
 * 
 * Inherits from Group.
 * 
 * Class for handling chat-room specific methods for MOOCchat chat sessions.
 */
class ChatGroup extends Group {
    /**
     * @param {Client} fromClient
     * @param {string} message
     */
    broadcastMessage(fromClient, message) {
        let messageObj = {
            screenName: this.getScreenName(fromClient),
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
    terminationCheck() {
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
    terminate() {
        this.broadcastEvent("chatGroupTerminated", {
            groupId: this.id
        });
    }

    /**
     * Broadcasts a socket event to let all clients know that a client has
     * changed their request to quit.
     */
    broadcastQuitChange(client, quitStatus) {
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
    queueClientToQuit(client) {
        if (this.clientsQueuedToQuit.indexOf(client) < 0) {
            this.clientsQueuedToQuit.push(client);
        }

        this.broadcastQuitChange(client, true);
    }

    /**
     * @param {Client} client
     */
    unqueueClientToQuit(client) {
        let clientIndex = this.clientsQueuedToQuit.indexOf(client);
        if (clientIndex > -1) {
            this.clientsQueuedToQuit.splice(clientIndex, 1);
        }

        this.broadcastQuitChange(client, false);
    }


    /**
     * @return {number}
     */
    numberOfClientsQueuedToQuit() {
        return this.clientsQueuedToQuit.length;
    }

    /**
     * @param {Client} client
     * @return {string}
     */
    getScreenName(client) {
        return `Student ${this.getClientIndex(client) + 1}`;    // TODO: Screen name needs review
    }

    /**
     * Backwards compatibility
     * Returns object array that previously was used with probAnswers.
     * 
     * @return {Object[]}
     */
    getGroupProbAnswerObjArray() {
        return this.clients.map(function(client) {
            return {
                screenName: this.getScreenName(client),
                answer: client.probingQuestionAnswer,
                justification: client.probJustification
            }
        }, this);
    }

    /**
     * Notifies all members of a chat group formation.
     * Intended to be used on initial formation only.
     */
    notifyEveryoneOnJoin() {
        this.clients.forEach(function(client) {
            this.emitEvent(client, "chatGroupFormed", {
                groupId: this.id,
                groupSize: this.numberOfClients(),
                groupAnswers: this.getGroupProbAnswerObjArray(),
                screenName: this.getScreenName(client)
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
    addClient(client) {
        super.addClient(client);

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
    removeClient(client) {
        super.removeClient(client);

        // TODO: Broadcast chatGroupClientLeft socket event
        // this.broadcastEvent("chatGroupClientLeft", {
        //     groupId: this.id,
        //     groupSize: this.numberOfClients()
        //     // ???
        // });
    }

    constructor(clients) {
        super(clients);

        this.log = [];
        this.clientsQueuedToQuit = [];

        this.notifyEveryoneOnJoin();
    }
}

module.exports = ChatGroup;
