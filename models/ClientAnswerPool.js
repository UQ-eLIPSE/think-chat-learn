/**
 * ClientAnswerPool
 */

"use strict";

// Configuration from /config/conf.json
const conf = global.conf;

const ChatGroup = require("./ChatGroup");

/**
 * Shuffles array in place.
 * http://stackoverflow.com/a/6274381
 * 
 * @param {any[]} a items The array containing the items.
 */
function shuffle(a) {
    let j, x, i;
    for (let i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}


class ClientAnswerWrapper {
    timeAlive() {
        return Date.now() - this.timestamp;
    }

    constructor(client) {
        this.client = client;
        this.timestamp = Date.now();
    }
}

/**
 * Handles queues of clients and attempts to distribute them
 * into groups with diverse answers where possible
 */
class ClientAnswerPool {
    /**
     * @param {Client} client
     */
    addClient(client) {
        if (!client.isProbingQuestionAnswerValid()) {
            throw new Error("Client answer not valid; Cannot assign to answer queue");
        }

        let clientAnswer = client.probingQuestionAnswer;

        // Answer is either not in range expected or some weird answer
        if (!this.answerQueues.hasOwnProperty(clientAnswer)) {
            throw new Error("Client answer not recognised; Cannot assign to answer queue");
        }

        let answerQueue = this.answerQueues[clientAnswer];

        // If the client is already in the queue, don't do anything.
        if (answerQueue.indexOf(client) > -1) {
            return;
        }

        // Add client to the queue once all okay 
        answerQueue.push(new ClientAnswerWrapper(client));
    }

    /**
     * Returns {Object(QueueKey{number?} => {number})}
     * 
     * @return {Object}
     */
    getQueueSizes() {
        let queueSizes = {};

        for (let queueKey of Object.keys(this.answerQueues)) {
            queueSizes[queueKey] = this.answerQueues[queueKey].length;
        }

        return queueSizes;
    }

    /**
     * Get keys of answer queues which have at least one client waiting.
     * 
     * @return {number[]} 
     */
    getViableQueues() {
        let queueSizes = this.getQueueSizes();
        let viableAnswerQueues = [];         // to store answer keys where queue size > 0.

        for (let queueKey of Object.keys(queueSizes)) {
            if (queueSizes[queueKey] > 0) {
                viableAnswerQueues.push(queueKey);
            }
        }

        return viableAnswerQueues;
    }

    /**
     * Returns Object(QueueKey{number?} => Milliseconds[]{number[]})
     * @return {Object}
     */
    getQueueTimes() {
        let queueTimes = {};

        for (let queueKey of Object.keys(this.answerQueues)) {
            queueTimes[queueKey] =
                this.answerQueues[queueKey].map(function(clientWrappedObj) {
                    return clientWrappedObj.timeAlive();
                });
        }

        return queueTimes;
    }

    /**
     * Retrieves only the wait times of the client
     * at the front of each answer queue.
     * 
     * Returns Object(QueueKey{number?} => Milliseconds{number})
     * 
     * @return {Object}
     */
    getQueueFrontTimes() {
        let queueTimes = {};

        for (let queueKey of Object.keys(this.answerQueues)) {
            let queue = this.answerQueues[queueKey];

            if (queue.length === 0) {
                queueTimes[queueKey] = 0;
                continue;
            }

            queueTimes[queueKey] = queue[0].timeAlive();
        }

        return queueTimes;
    }

    /**
     * @return {boolean} Whether there are clients waiting in some queue too long
     */
    areClientsWaitingTooLong() {
        let waitTimes = this.getQueueFrontTimes();

        for (let queueKey of Object.keys(waitTimes)) {
            if (waitTimes[queueKey] > this.desiredMaxWaitTime) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return {number}
     */
    totalPoolSize() {
        let answerQueues = this.answerQueues;
        
        // Go over answerQueues and sum the length of each queues
        return Object.keys(answerQueues).reduce(function(sum, queueKey) {
            return sum + answerQueues[queueKey].length;
        }, 0);
    }

    /**
     * @return {ClientAnswerWrapper[]}
     */
    getFlatQueue() {
        let answerQueues = this.answerQueues;
        
        // Go over answerQueues to extract the queues themselves
        // before applying them to Array#concat to join them together
        let queues = Object.keys(answerQueues).map(function(queueKey) {
            return answerQueues[queueKey];
        });
        
        return [].concat.apply([], queues);
    }

    /**
     * Get flat queue sorted by wait time, where head is longest wait time.
     * @return {ClientAnswerWrapper[]}
     */
    getQueueSortedByTime() {
        return this.getFlatQueue()
            .sort(function(a, b) {
                let waitTimeA = a.timeAlive();
                let waitTimeB = b.timeAlive();

                if (waitTimeA < waitTimeB) {
                    return 1;
                }

                if (waitTimeA > waitTimeB) {
                    return -1;
                }

                return 0;
            });
    }

    /**
     * Generates a chat group, only when it deems possible or "good".
     * 
     * Does not automatically exhaust pool - this method must be run repeatedly.
     * 
     * @return {ChatGroup | undefined}
     */
    tryMakeChatGroup() {
        let viableAnswerQueues = this.getViableQueues();

        // If there is enough diversity, create group now
        if (viableAnswerQueues.length >= this.desiredGroupSize) {
            return this.createChatGroupFromQueueKeys(viableAnswerQueues);
        }

        // If someone is waiting too long, then create groups now
        if (this.areClientsWaitingTooLong()) {

            // Determine if there are not enough clients to form a group of the desired size
            let totalPoolSize = this.totalPoolSize();
                
            // If pool size = desiredGroupSize + 1, attempt to create a group of size 2
            // now to attempt to prevent loners from appearing?
            if (totalPoolSize === (this.desiredGroupSize + 1)) {
                let groupOfTwo = this.getQueueSortedByTime().slice(0, 2);
                this.removeClients(groupOfTwo);
                return this.createChatGroupFromWrappedClients(groupOfTwo);
            }

            if (totalPoolSize < this.desiredGroupSize) {

                // TODO: The below block needs to be implemented!
                // // If there's only one, then have a backup client (e.g. tutor) join the group
                // if (totalPoolSize === 1) {
                //     // TODO: How to add a backup client?
                                 
                //     return;
                // }

                // If we have two or more students (but less than the ideal group size)
                // then just throw them together
                let clientsToFormGroup = this.getFlatQueue();
                this.removeClients(clientsToFormGroup);
                return this.createChatGroupFromWrappedClients(clientsToFormGroup);
            }

            // Clear those in order by wait time
            let clientsToFormGroup = this.getQueueSortedByTime().slice(0, this.desiredGroupSize)
            this.removeClients(clientsToFormGroup);
            return this.createChatGroupFromWrappedClients(clientsToFormGroup);
        }

        // Don't produce a group when we don't deem it necessary
        return;
    }

    /**
     * @param {number[]} queueKeys The keys to each answer queue from which to get clients from to form a group
     * @return {ChatGroup}
     */
    createChatGroupFromQueueKeys(queueKeys) {
        // Try to form the group of our desired size; otherwise use what we are given
        let groupSize = this.desiredGroupSize;

        if (queueKeys.length < groupSize) {
            groupSize = queueKeys.length;
        }

        // Shuffle the queue keys so we get random answer spread in groups
        shuffle(queueKeys);


        let clientsToFormGroup = [];        // {Client[]}

        for (let i = 0; i < groupSize; ++i) {
            // Get the client at the front of the i-th answer queue
            clientsToFormGroup.push(this.removeClientFromFrontOfAnswerQueue(queueKeys[i]));
        }

        return this.createChatGroupFromClients(clientsToFormGroup);
    }

    /**
     * @param {Client[]} clients
     * @return {ChatGroup}
     */
    createChatGroupFromClients(clients) {
        return new ChatGroup(clients);
    }

    /**
     * @param {ClientAnswerWrapper[]} clientWrappedObjs
     * @return {ChatGroup}
     */
    createChatGroupFromWrappedClients(clientWrappedObjs) {
        let clients = clientWrappedObjs.map(function(clientWrappedObj) {
            return clientWrappedObj.client;
        });

        return this.createChatGroupFromClients(clients);
    }

    /**
     * @param {number} queueKey The key to the answer queue
     * @return {Client}
     */
    removeClientFromFrontOfAnswerQueue(queueKey) {
        // Array#shift() gets the first element of the array and then we unwrap the ClientAnswerWrapper
        return this.answerQueues[queueKey].shift().client;
    }

    /**
     * @param {Client} client
     */
    removeClient(client) {
        // Need to search through the entire pool to remove
        for (let queueKey of Object.keys(this.answerQueues)) {
            let index = this.answerQueues[queueKey].indexOf(client);
            
            if (index > -1) {
                // Remove the client out and return it
                return this.answerQueues[queueKey].splice(index, 1)[0].client;
            }
        }

        throw new Error("Client could not be found in pool");
    }
    
    /**
     * @param {Client[]} clients
     */
    removeClients(clients) {
        clients.forEach(function(client) {
            this.removeClient(client);
        }, this);
    }

    /**
     * @param {Quiz} quiz
     */
    constructor(quiz) {
        this.desiredGroupSize = conf.groupSize;
        this.desiredMaxWaitTime = 1 * 60 * 1000;    // TODO: 1 minute for now

        this.quiz = quiz;

        // Determine how many answers are available
        this.numberOfAnswers = this.quiz.probingQuestionChoices.length;

        // Set up answer queues as a map between an answer number => ClientAnswerWrapper[] 
        this.answerQueues = {};

        for (let i = 0; i < this.numberOfAnswers; ++i) {
            this.answerQueues[i] = [];   // {ClientAnswerWrapper[]}
        }
    }
}

module.exports = ClientAnswerPool;
