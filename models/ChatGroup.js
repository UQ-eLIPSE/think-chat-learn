/**
 * ChatGroup
 */

"use strict";

const Group = require("./Group"); 
const Client = require("./client"); 

class ChatGroup extends Group {
    /**
     * @param {Client} fromClient
     * @param {string} message
     */
    broadcastMessage(fromClient, message){
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
     * Determines if the discussion is to be terminated because everyone would like to quit
     */
    terminationCheck() {
        if (this.numberOfClientsQueuedToQuit() === this.numberOfClients()) {
            this.terminate();
            return true;
        }
        
        return false;
    }
    
    /**
     * Terminates discussion
     */
    terminate() {
        // TODO: Broadcast socket event to quit chat and move on
        this.broadcastEvent("chatGroupTerminated", {
            groupId: this.id
        });
    }
    
    
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
        let clientIndex = this.clientQueuedToQuit.indexOf(client); 
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
        });
    }
    
    notifyEveryoneOnJoin() {
        this.broadcastEvent("chatGroupFormed", {
            groupId: this.id,
            groupSize: this.numberOfClients(),
            groupAnswers: this.getGroupProbAnswerObjArray()
        });
    }
        
    constructor() {
        // super();
        
        this.log = [];
        this.clientsQueuedToQuit = [];
        
        this.notifyEveryoneOnJoin();
    }
}

module.exports = ChatGroup;
