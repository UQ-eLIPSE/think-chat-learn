/**
 * ClientAnswerPool
 */

"use strict";

// Configuration from /config/conf.json
var conf = global.conf;

var ChatGroup = require("./ChatGroup");

/**
 * Shuffles array in place.
 * http://stackoverflow.com/a/6274381
 * 
 * @param {any[]} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (var i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

/**
 * Internal class for wrapping clients with their entry timestamp
 */
var ClientAnswerWrapper = function(client) {
    this.client = client;
    this.timestamp = Date.now();
}

ClientAnswerWrapper.prototype.timeAlive = function() {
    return Date.now() - this.timestamp;
}


/**
 * Handles queues of clients and attempts to distribute them
 * into groups with diverse answers where possible
 * 
 * @param {Quiz} quiz
 */
var ClientAnswerPool = function(quiz) {
    this.desiredGroupSize = conf.groupSize;
    this.desiredMaxWaitTime = 1 * 60 * 1000;    // TODO: 1 minute for now

    this.quiz = quiz;

    // Determine how many answers are available
    this.numberOfAnswers = this.quiz.probingQuestionChoices.length;

    // Set up answer queues as a map between an answer number => ClientAnswerWrapper[] 
    this.answerQueues = {};

    for (var i = 0; i < this.numberOfAnswers; ++i) {
        this.answerQueues[i] = [];   // {ClientAnswerWrapper[]}
    }
}


/**
 * @param {Client} client
 */
ClientAnswerPool.prototype.addClient = function(client) {
    if (!client.isProbingQuestionAnswerValid()) {
        throw new Error("Client answer not valid; Cannot assign to answer queue");
    }

    var clientAnswer = client.probingQuestionAnswer;

    // Answer is either not in range expected or some weird answer
    if (!this.answerQueues.hasOwnProperty(clientAnswer)) {
        throw new Error("Client answer not recognised; Cannot assign to answer queue");
    }

    var answerQueue = this.answerQueues[clientAnswer];

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
ClientAnswerPool.prototype.getQueueSizes = function() {
    var queueSizes = {};

    var arr = Object.keys(this.answerQueues);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
        queueSizes[queueKey] = this.answerQueues[queueKey].length;
    }

    return queueSizes;
}

/**
 * Get keys of answer queues which have at least one client waiting.
 * 
 * @return {number[]} 
 */
ClientAnswerPool.prototype.getViableQueues = function() {
    var queueSizes = this.getQueueSizes();
    var viableAnswerQueues = [];         // to store answer keys where queue size > 0.

    var arr = Object.keys(queueSizes);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
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
ClientAnswerPool.prototype.getQueueTimes = function() {
    var queueTimes = {};

    var arr = Object.keys(this.answerQueues);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
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
ClientAnswerPool.prototype.getQueueFrontTimes = function() {
    var queueTimes = {};

    var arr = Object.keys(this.answerQueues);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
        var queue = this.answerQueues[queueKey];

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
ClientAnswerPool.prototype.areClientsWaitingTooLong = function() {
    var waitTimes = this.getQueueFrontTimes();

    var arr = Object.keys(waitTimes);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
        if (waitTimes[queueKey] > this.desiredMaxWaitTime) {
            return true;
        }
    }

    return false;
}

/**
 * @return {number}
 */
ClientAnswerPool.prototype.totalPoolSize = function() {
    var answerQueues = this.answerQueues;

    // Go over answerQueues and sum the length of each queues
    return Object.keys(answerQueues).reduce(function(sum, queueKey) {
        return sum + answerQueues[queueKey].length;
    }, 0);
}

/**
 * @return {ClientAnswerWrapper[]}
 */
ClientAnswerPool.prototype.getFlatQueue = function() {
    var answerQueues = this.answerQueues;

    // Go over answerQueues to extract the queues themselves
    // before applying them to Array#concat to join them together
    var queues = Object.keys(answerQueues).map(function(queueKey) {
        return answerQueues[queueKey];
    });

    return [].concat.apply([], queues);
}

/**
 * Get flat queue sorted by wait time, where head is longest wait time.
 * @return {ClientAnswerWrapper[]}
 */
ClientAnswerPool.prototype.getQueueSortedByTime = function() {
    return this.getFlatQueue()
        .sort(function(a, b) {
            var waitTimeA = a.timeAlive();
            var waitTimeB = b.timeAlive();

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
ClientAnswerPool.prototype.tryMakeChatGroup = function(backupClientQueue) {
    var viableAnswerQueues = this.getViableQueues();

    // If there is enough diversity, create group now
    if (viableAnswerQueues.length >= this.desiredGroupSize) {
        return this.createChatGroupFromQueueKeys(viableAnswerQueues);
    }

    // If someone is waiting too long, then create groups now
    if (this.areClientsWaitingTooLong()) {

        // Determine if there are not enough clients to form a group of the desired size
        var totalPoolSize = this.totalPoolSize();

        // If pool size = desiredGroupSize + 1, attempt to create a group of size 2
        // now to attempt to prevent loners from appearing?
        if (totalPoolSize === (this.desiredGroupSize + 1)) {
            var groupOfTwo = this.getQueueSortedByTime().slice(0, 2);
            this.removeClients(groupOfTwo);
            return this.createChatGroupFromWrappedClients(groupOfTwo);
        }

        if (totalPoolSize < this.desiredGroupSize) {
            if (totalPoolSize === 1 &&
                backupClientQueue.attemptTransferBackupClientToClientPool(this)) {
                // Don't do anything if there is a backup client to be placed into the pool
                // (happens when #attemptTransferBackupClientToClientPool returns TRUE)
                return;
            }

            // Give up: If we have students (but less than the ideal group size)
            // then just throw them together
            var clientsToFormGroup = this.getFlatQueue();
            this.removeClients(clientsToFormGroup);
            return this.createChatGroupFromWrappedClients(clientsToFormGroup);
        }

        // Clear those in order by wait time
        var clientsToFormGroup = this.getQueueSortedByTime().slice(0, this.desiredGroupSize)
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
ClientAnswerPool.prototype.createChatGroupFromQueueKeys = function(queueKeys) {
    // Try to form the group of our desired size; otherwise use what we are given
    var groupSize = this.desiredGroupSize;

    if (queueKeys.length < groupSize) {
        groupSize = queueKeys.length;
    }

    // Shuffle the queue keys so we get random answer spread in groups
    shuffle(queueKeys);


    var clientsToFormGroup = [];        // {Client[]}

    for (var i = 0; i < groupSize; ++i) {
        // Get the client at the front of the i-th answer queue
        clientsToFormGroup.push(this.removeClientFromFrontOfAnswerQueue(queueKeys[i]));
    }

    return this.createChatGroupFromClients(clientsToFormGroup);
}

/**
 * @param {Client[]} clients
 * @return {ChatGroup}
 */
ClientAnswerPool.prototype.createChatGroupFromClients = function(clients) {
    return new ChatGroup(clients);
}

/**
 * @param {ClientAnswerWrapper[]} clientWrappedObjs
 * @return {ChatGroup}
 */
ClientAnswerPool.prototype.createChatGroupFromWrappedClients = function(clientWrappedObjs) {
    var clients = clientWrappedObjs.map(function(clientWrappedObj) {
        return clientWrappedObj.client;
    });

    return this.createChatGroupFromClients(clients);
}

/**
 * @param {number} queueKey The key to the answer queue
 * @return {Client}
 */
ClientAnswerPool.prototype.removeClientFromFrontOfAnswerQueue = function(queueKey) {
    // Array#shift() gets the first element of the array and then we unwrap the ClientAnswerWrapper
    return this.answerQueues[queueKey].shift().client;
}

/**
 * @param {Client} client
 */
ClientAnswerPool.prototype.removeClient = function(client) {
    // Need to search through the entire pool to remove
    var arr = Object.keys(this.answerQueues);
    for (var i = 0; i < arr.length; ++i) {
        var queueKey = arr[i];
        var index = this.answerQueues[queueKey].indexOf(client);

        if (index > -1) {
            // Remove the client out and return it
            return this.answerQueues[queueKey].splice(index, 1)[0].client;
        }
    }

    // throw new Error("Client could not be found in pool");
}

/**
 * @param {Client[]} clients
 */
ClientAnswerPool.prototype.removeClients = function(clients) {
    clients.forEach(function(client) {
        this.removeClient(client);
    }, this);
}

module.exports = ClientAnswerPool;
