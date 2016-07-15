var conf = global.conf;
var io = global.io;

var mongojs = require("mongojs");
var db_wrapper = require("./database");

var LTIProcessor = require("../models/LTIProcessor").LTIProcessor;

var Client = require('../models/client');

var ClientAnswerPool = require("../models/ClientAnswerPool");
var ChatGroup = require("../models/ChatGroup");
var BackupClientQueue = require("../models/BackupClientQueue");

var Session = require("../models/Session");
var SessionManager = require("../models/SessionManager");

// var util = require('../helpers/util');
// var randomInteger = util.randomInteger;





var allSessions = new SessionManager();

// LTI processor for incoming logins
var ltiProcessor = new LTIProcessor(conf.lti.signingInfo);
ltiProcessor.setTestMode(conf.lti.testMode);


// Mappings between quiz schedule ID and the different groups and queues used

/** Object(QuizScheduleId{string} => BackupClientQueue) */
var quizSchedule_BackupClientQueue = {};

/** Object(QuizScheduleId{string} => ClientAnswerPool) */
var quizSchedule_ClientAnswerPool = {};

/** Object(QuizScheduleId{string} => ChatGroup[]) */
var quizSchedule_ChatGroupArray = {};




// ===== Utils =====

/**
 * @param {string} sessionId
 */
function getSessionFromId(sessionId) {
    return allSessions.getSessionById(sessionId);
}

function getClientAnswerPoolFromSession(session) {
    return quizSchedule_ClientAnswerPool[session.getQuizScheduleIdString()];
}

function getBackupClientQueueFromSession(session) {
    return quizSchedule_BackupClientQueue[session.getQuizScheduleIdString()];
}

function getChatGroupsFromSession(session) {
    return quizSchedule_ChatGroupArray[session.getQuizScheduleIdString()];
}

function getChatGroupFromSession(session) {
    var chatGroups = getChatGroupsFromSession(session);
    var client = session.client;

    for (var i = 0; i < chatGroups.length; ++i) {
        var chatGroup = chatGroups[i];

        if (chatGroup.getClientIndex(client) > -1) {
            return chatGroup;
        }
    }
}

function deleteChatGroupUsingSession(session) {
    var chatGroupToDelete = getChatGroupFromSession(session);
    var allChatGroupsInQuiz = getChatGroupsFromSession(session);
    var chatGroupIndex = allChatGroupsInQuiz.indexOf(chatGroupToDelete);

    if (chatGroupIndex > -1) {
        return allChatGroupsInQuiz.splice(chatGroupIndex, 1);
    }
}

/**
 * @param {Client} client
 */
function removeClientFromEverything(client) {
    var session = allSessions.getSessionByClient(client);

    var clientAnswerPool = getClientAnswerPoolFromSession(session);
    var backupClientQueue = getBackupClientQueueFromSession(session);
    var chatGroup = getChatGroupFromSession(session);

    if (backupClientQueue && backupClientQueue.removeClient(client)) {
        backupClientQueue.broadcastUpdate();
    }

    if (clientAnswerPool && clientAnswerPool.removeClient(client)) {
        broadcastPoolCountToBackupQueue(clientAnswerPool);
    }

    if (chatGroup && chatGroup.removeClient(client)) {
        // If the chat group terminates, then remove the chat group from array
        if (chatGroup.terminationCheck()) {
            deleteChatGroupUsingSession(session);
        }
    }
}



// ===== Chat group =====

/**
 * @return {ChatGroup | undefined}
 */
function formChatGroup(clientAnswerPool) {
    var newChatGroup = clientAnswerPool.tryMakeChatGroup();

    // Store reference to chat group if formed
    if (newChatGroup) {
        var quizScheduleIdString = newChatGroup.clients[0].getSession().getQuizScheduleIdString();

        quizSchedule_ChatGroupArray[quizScheduleIdString].push(newChatGroup);

        newChatGroup.clients.forEach(function(client) {
            db_wrapper.userSession.update({
                _id: mongojs.ObjectId(client.getSession().getId())
            },
                {
                    $set: {
                        chatGroupId: newChatGroup.id
                    }
                });
        });

        broadcastPoolCountToBackupQueue(clientAnswerPool);

        return newChatGroup;
    }
}

// Recurring task
// TODO: Have a library/package handle this task in a different thread?    
var chatGroupFormationLoop = (function() {
    var timeBetweenChecks = conf.chat.groups.formationIntervalMs;
    var timeoutHandles = {};



    /**
     * Runs another round of the loop, or starts the loop if not already active.
     */
    function run(clientAnswerPool) {
        clearTimeout(timeoutHandles[clientAnswerPool.id]);

        var newChatGroup = formChatGroup(clientAnswerPool);

        if (newChatGroup) {
            setImmediate(run, clientAnswerPool);   // Process next group at next available timeslot
        } else {
            timeoutHandles[clientAnswerPool.id] = setTimeout(run, timeBetweenChecks, clientAnswerPool);
        }
    }

    return {
        run: run
    };
})();

/**
 * data = {
 *      sessionId {string}
 * }
 * 
 * @param {any} data
 */
function handleChatGroupJoinRequest(data) {
    var session = getSessionFromId(data.sessionId);
    var client = session.client;
    var answerOptionId = session.responseInitial.optionId;
    var clientAnswerPool = getClientAnswerPoolFromSession(session);

    clientAnswerPool.addClient(client, answerOptionId);

    broadcastPoolCountToBackupQueue(clientAnswerPool);

    chatGroupFormationLoop.run(clientAnswerPool);
}

/**
 * data = {
 *      groupId {string}
 *      sessionId {string}
 *      quitStatus {boolean}
 * }
 * 
 * @param {any} data
 */
function handleChatGroupQuitStatusChange(data) {
    var session = getSessionFromId(data.sessionId);
    var client = session.client;
    var chatGroup = getChatGroupFromSession(session);

    if (data.quitStatus) {
        chatGroup.queueClientToQuit(client);
    } else {
        chatGroup.unqueueClientToQuit(client);
    }

    // If the chat group terminates, then remove the chat group reference
    if (chatGroup.terminationCheck()) {
        deleteChatGroupUsingSession(session);
    }
}

/**
 * data = {
 *      groupId {string}
 *      sessionId {string}
 *      message {string}
 * }
 * 
 * @param {any} data
 */
function handleChatGroupMessage(data) {
    var session = getSessionFromId(data.sessionId);

    var client = session.client;
    var chatGroup = getChatGroupFromSession(session);

    db_wrapper.chatMessage.create({
        content: data.message,
        sessionId: mongojs.ObjectId(session.getId()),
        timestamp: new Date()
    }, function(err, result) {
        // TODO: 
    });

    chatGroup.broadcastMessage(client, data.message);
}



// ===== Logins =====

/**
 * data is whatever LTI gives us
 * 
 * Key values to note:
 * 
 * data = {
 *      user_id {string}
 * 
 *      lis_person_name_full {string}
 *      lis_person_name_family {string}
 *      lis_person_name_given {string}
 * 
 *      lis_person_contact_email_primary {string}
 * 
 *      roles {string}
 * 
 *      ...
 * }
 */
function handleLoginLti(data, socket) {
    function notifyClientOnError(err) {
        socket.emit("loginFailure", (err && err.message) ? err.message : "Unexpected error");
    }

    // Callback chain
    runCallbackChain(
        notifyClientOnError,
        [
            processLtiObject,
            checkUserId,
            retrieveUserId,
            findScheduledQuiz,
            findSurvey,
            setupClientAnswerPool,
            setupClient,
            writeSessionToDb,
            notifyClientOfLogin
        ]);


    // Callback chain and synchronisation
    function runCallbackChain(errorThrowFunc, callbackChain) {
        var chainIndex = -1;
        var errorThrown = false;

        var throwErr = function(err) {
            errorThrown = true;
            errorThrowFunc(err);
            return;
        }

        var callbackChainer = function() {
            var nextCallback = callbackChain[++chainIndex];
            if (errorThrown || !nextCallback) { return; }

            nextCallback(throwErr, callbackChainer);
        };

        callbackChainer();
    }

    function nCallbackSyncGenerator(n, done) {
        return function() {
            if (--n === 0) {
                done();
            }
        }
    }




    // Variables in serialised callback chain

    /** {ILTIData} */
    var ltiObject;

    /** {string} */
    var ltiUsername;

    /** {string} */
    var userId;

    /** {IDB_QuizSchedule} */
    var quizSchedule;

    /** {IDB_Question} */
    var question;

    /** {IDB_QuestionOption[]} */
    var questionOptions;

    /** {IDB_Survey} */
    var survey;

    /** {Client} */
    var client;

    /** {Session} */
    var session;

    function processLtiObject(throwErr, next) {
        try {
            ltiObject = ltiProcessor.verifyAndReturnLTIObj(data);
        } catch (e) {
            return throwErr(e);
        }

        next();
    }

    function checkUserId(throwErr, next) {
        ltiUsername = ltiObject.user_id;

        if (!ltiUsername) {
            return throwErr(new Error('No user ID received.'));
        }

        if (allSessions.hasSessionWithUsername(ltiUsername)) {
            return throwErr(new Error('The username is being used.'));
        }

        next();
    }

    function retrieveUserId(throwErr, next) {
        db_wrapper.user.read({ username: ltiUsername }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            if (result.length > 1) {
                return throwErr(new Error("More than one user with same username detected."));
            }

            // New user
            if (result.length === 0) {
                var ltiFirstName = ltiObject.lis_person_name_given || "";
                var ltiLastName = ltiObject.lis_person_name_family || "";

                db_wrapper.user.create({
                    _id: mongojs.ObjectId(require('crypto').randomBytes(12).toString('hex')),
                    username: ltiUsername,
                    firstName: ltiFirstName,
                    lastName: ltiLastName
                }, function(err, result) {
                    if (err) {
                        return throwErr(err);
                    }

                    userId = result._id.toString();
                    next();
                });

                return;
            }

            // Existing user
            userId = result[0]._id.toString();
            next();
        });
    }

    function findScheduledQuiz(throwErr, next) {
        var now = new Date();

        db_wrapper.quizSchedule.read({
            "availableStart": { "$lte": now },
            "availableEnd": { "$gte": now }
        }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            // Find first available scheduled quiz session
            if (result.length === 0) {
                return throwErr(new Error("No scheduled quizzes right now. Try again during a scheduled time."));
            }

            quizSchedule = result[0];




            // Sync on n = 2 (question + question options)
            var callbackSync = nCallbackSyncGenerator(2, next);

            db_wrapper.question.read({
                "_id": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    return throwErr(err);
                }

                if (result.length === 0) {
                    return throwErr(new Error("No question with _id = " + quizSchedule.questionId));
                }

                question = result[0];
                callbackSync();
            });

            db_wrapper.questionOption.read({
                "questionId": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    return throwErr(err);
                }

                if (result.length === 0) {
                    return throwErr(new Error("No question options for " + quizSchedule.questionId));
                }

                questionOptions = result;
                callbackSync();
            });
        });
    }

    function findSurvey(throwErr, next) {
        var now = new Date();

        db_wrapper.survey.read({
            "availableStart": { "$lte": now }
        }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            // Find first available survey at this time session
            if (result.length === 0) {
                return throwErr(new Error("No survey available at this time. Survey required."));
            }

            survey = result[0];

            next();
        });
    }

    function setupClientAnswerPool(throwErr, next) {
        var quizScheduleIdString = quizSchedule._id.toString();

        if (!quizSchedule_ClientAnswerPool[quizScheduleIdString]) {
            var newBackupClientQueue = new BackupClientQueue();
            var newClientAnswerPool = new ClientAnswerPool(questionOptions, newBackupClientQueue);

            quizSchedule_BackupClientQueue[quizScheduleIdString] = newBackupClientQueue;
            quizSchedule_ClientAnswerPool[quizScheduleIdString] = newClientAnswerPool;
            quizSchedule_ChatGroupArray[quizScheduleIdString] = [];     // Empty array to be filled in when chat groups form later down the track

            chatGroupFormationLoop.run(newClientAnswerPool);
        }

        next();
    }

    function setupClient(throwErr, next) {
        client = new Client();
        client.userId = userId;
        client.username = ltiUsername;
        client.setSocket(socket);

        next();
    }

    function writeSessionToDb(throwErr, next) {
        db_wrapper.userSession.create({
            _id: mongojs.ObjectId(require('crypto').randomBytes(12).toString('hex')),
            userId: mongojs.ObjectId(userId),

            timestampStart: new Date(),
            timestampEnd: null,

            chatGroupId: null,
            quizScheduleId: quizSchedule._id,

            responseInitialId: null,
            responseFinalId: null
        }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            var sessionIdString = result._id.toString();

            // Set up session
            session = new Session(client, quizSchedule);
            session.setId(sessionIdString);
            session.setSurvey(survey);
            session.setQuizQuestion(question);
            session.setQuizQuestionOptions(questionOptions);

            allSessions.addSession(session);

            next();
        });
    }

    function notifyClientOfLogin(throwErr, next) {
        // Complete login by notifying client
        socket.emit('loginSuccess', {
            sessionId: session.getId(),
            username: client.username,
            // hasElevatedPermissions: session.hasElevatedPermissions,
            quiz: {
                quizSchedule: quizSchedule,
                question: question,
                questionOptions: questionOptions
            },
            survey: survey
        });

        next();
    }
}



// ===== Student client pool =====

function broadcastPoolCountToBackupQueue(clientAnswerPool) {
    clientAnswerPool.backupClientQueue.broadcastEvent("clientPoolCountUpdate", {
        numberOfClients: clientAnswerPool.totalPoolSize()
    });
}



// ===== Question + answer =====

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
function handleAnswerSubmissionInitial(data) {
    var session = getSessionFromId(data.sessionId);

    var client = session.client;

    var username = client.username;
    var socket = client.getSocket();

    var optionIdString = data.optionId;
    var justification = data.justification;

    // Check that option ID is valid for session
    if (optionIdString &&
        session.quizQuestionOptions
            .map(function(option) { return option._id.toString(); })
            .indexOf(optionIdString) < 0) {
        // TODO: Return error to client?
        return;
    }

    db_wrapper.questionResponse.create({
        optionId: (optionIdString ? mongojs.ObjectId(optionIdString) : null),
        justification: justification,
        timestamp: new Date()
    }, function(err, result) {
        if (err) {
            // TODO: Return error to client?
            return;
        }

        var questionResponseObjectId = result._id;

        session.responseInitial._id = questionResponseObjectId.toString();
        session.responseInitial.optionId = optionIdString;
        session.responseInitial.justification = justification;

        db_wrapper.userSession.update(
            {
                _id: mongojs.ObjectId(session.getId())
            },
            {
                $set: {
                    responseInitialId: questionResponseObjectId
                }
            },
            function(err, result) {
                if (err) {
                    // TODO: Return error to client?
                    return;
                }

                socket.emit("answerSubmissionInitialSaved");
            });
    });
}

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
function handleAnswerSubmissionFinal(data) {
    var session = getSessionFromId(data.sessionId);

    var client = session.client;

    var username = client.username;
    var socket = client.getSocket();

    var optionIdString = data.optionId;
    var justification = data.justification;

    // Check that option ID is valid for session
    if (optionIdString &&
        session.quizQuestionOptions
            .map(function(option) { return option._id.toString(); })
            .indexOf(optionIdString) < 0) {
        // TODO: Return error to client?
        return;
    }

    db_wrapper.questionResponse.create({
        optionId: (optionIdString ? mongojs.ObjectId(optionIdString) : null),
        justification: justification,
        timestamp: new Date()
    }, function(err, result) {
        if (err) {
            // TODO: Return error to client?
            return;
        }

        var questionResponseObjectId = result._id;

        session.responseFinal._id = questionResponseObjectId.toString();
        session.responseFinal.optionId = optionIdString;
        session.responseFinal.justification = justification;

        db_wrapper.userSession.update(
            {
                _id: mongojs.ObjectId(session.getId())
            },
            {
                $set: {
                    responseFinalId: questionResponseObjectId
                }
            },
            function(err, result) {
                if (err) {
                    // TODO: Return error to client?
                    return;
                }

                socket.emit("answerSubmissionFinalSaved");
            });
    });
}




/**
 * data = {
 *      sessionId {string}
 *      content {IDB_SurveyResponse_Content[]}
 * }
 */
function saveSurvey(data) {
    var session = getSessionFromId(data.sessionId);

    db_wrapper.surveyResponse.create({
        sessionId: mongojs.ObjectId(session.getId()),
        surveyId: session.survey._id,
        timestamp: new Date(),
        content: data.content
    }, function(err, result) {
        // TODO:
    });
}





// ===== Backup client =====

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientLogout(data) {
    var session = getSessionFromId(data.sessionId);
    var client = session.client;

    removeClientFromEverything(client);
}

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
function handleBackupClientEnterQueue(data) {
    var session = getSessionFromId(data.sessionId);

    var backupClientQueue = getBackupClientQueueFromSession(session);
    var client = session.client;

    // TODO: Consider combining with answerInitial + answerFinal handlers?
    session.responseInitial.optionId = data.optionId;
    session.responseInitial.justification = data.justification;

    // Add the client to the backup queue here, only *after* we
    // have all the information for question/answer
    backupClientQueue.addClient(client);

    client.getSocket().emit("backupClientEnterQueueState", {
        success: true
    });
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientReturnToQueue(data) {
    var session = getSessionFromId(data.sessionId);

    var backupClientQueue = getBackupClientQueueFromSession(session);
    var client = session.client;

    // If session already has answer then return to queue
    if (session.responseInitial.optionId &&
        session.responseInitial.justification) {

        backupClientQueue.addClient(client);

        client.getSocket().emit("backupClientEnterQueueState", {
            success: true
        });
    }
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientStatusRequest(data) {
    var session = getSessionFromId(data.sessionId);

    var backupClientQueue = getBackupClientQueueFromSession(session);
    var clientAnswerPool = getClientAnswerPoolFromSession(session);

    backupClientQueue.broadcastUpdate();
    broadcastPoolCountToBackupQueue(clientAnswerPool);
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientTransferConfirm(data) {
    var session = getSessionFromId(data.sessionId);

    var backupClientQueue = getBackupClientQueueFromSession(session);
    var clientAnswerPool = getClientAnswerPoolFromSession(session);
    var client = session.client;

    if (backupClientQueue.clientOutTray && backupClientQueue.clientOutTray.client === client) {
        backupClientQueue.moveOutTrayClientToClientPool();
        chatGroupFormationLoop.run(clientAnswerPool);
    }
}













io.sockets.on('connection', function(socket) {
    /// Registration of socket event handlers

    /* On websocket disconnect */
    socket.on('disconnect', disconnect);

    /* Submission of answers and surveys */
    socket.on("answerSubmissionInitial", handleAnswerSubmissionInitial);
    socket.on("answerSubmissionFinal", handleAnswerSubmissionFinal);
    socket.on("submitSurvey", saveSurvey);

    /* Log ins */
    socket.on("loginLti", function(data) { handleLoginLti(data, socket); });

    /* Chat group discussion */
    socket.on("chatGroupJoinRequest", handleChatGroupJoinRequest);
    socket.on("chatGroupMessage", handleChatGroupMessage);
    socket.on("chatGroupQuitStatusChange", handleChatGroupQuitStatusChange);

    /* Backup client */
    socket.on("backupClientLogout", handleBackupClientLogout);
    socket.on("backupClientEnterQueue", handleBackupClientEnterQueue);
    socket.on("backupClientReturnToQueue", handleBackupClientReturnToQueue);
    socket.on("backupClientStatusRequest", handleBackupClientStatusRequest);
    socket.on("backupClientTransferConfirm", handleBackupClientTransferConfirm);

    /* Testing */
    // socket.on('loadTestReq', loadTest);
    // socket.on('saveLoadTestResults', saveLoadTestResults);

    // For unit test framework to know when to begin
    socket.emit('connected');




    // function loadTest(data) {  //  SPECIAL EVENT HANDLER FOR LOAD TEST
    //     db_wrapper.question.read({ questionGroup: conf.activeQuestionGroup },
    //         function(err, dbResults) {
    //             var qNum = randomInteger(0, dbResults.length);
    //             var resp = dbResults[qNum];
    //             // console.log('#sending a load test response (%d).', qNum);
    //             socket.emit('loadTestResp', resp);
    //         });
    // }

    // function saveLoadTestResults(data) {  //  data {results, options}
    //     var outputFilename = 'load_test_results_' + (new Date()).getTime() + '.json';

    //     fs.writeFile(outputFilename, JSON.stringify(data.results, null, 2), function(err) {
    //         if (err) {
    //             console.log(err);
    //         }
    //         else {
    //             console.log("The results has been saved to " + outputFilename);
    //         }
    //     });
    // }

    function disconnect() {
        var session = allSessions.getSessionBySocket(socket);

        // No session = no action to do
        if (!session) {
            return;
        }

        // Clean up sessions, pools, queues, chats
        var client = session.client;

        if (client) {
            removeClientFromEverything(client);
        }

        var clientAnswerPool = getClientAnswerPoolFromSession(session);
        var backupClientQueue = getBackupClientQueueFromSession(session);
        var chatGroups = getChatGroupsFromSession(session);

        if (clientAnswerPool.totalPoolSize() === 0 &&
            backupClientQueue.getQueueSize() === 0 &&
            chatGroups.length === 0) {
            delete quizSchedule_ClientAnswerPool[session.getQuizScheduleIdString()];
            delete quizSchedule_BackupClientQueue[session.getQuizScheduleIdString()];
            delete quizSchedule_ChatGroupArray[session.getQuizScheduleIdString()];
        }

        allSessions.removeSession(session);

        db_wrapper.userSession.update(
            {
                _id: mongojs.ObjectId(session.getId())
            },
            {
                $set: {
                    timestampEnd: new Date()
                }
            },
            function(err, result) {
                // TODO:
            });
    }
});

console.log("All websocket events registered.");