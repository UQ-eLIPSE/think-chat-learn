// var app = global.app;
var conf = global.conf;
var io = global.io;

// var sessionData = require('../../config/sessions.json');
var mongojs = require("mongojs");
var db_wrapper = require("./database");

var LTIProcessor = require("../models/LTIProcessor").LTIProcessor;

var Client = require('../models/client');

var DiscussionRoom = require('../models/discussionRoom');
var QuizRoom = require('../models/quizRoom');

var ClientAnswerPool = require("../models/ClientAnswerPool");
var ChatGroup = require("../models/ChatGroup");
var BackupClientQueue = require("../models/BackupClientQueue");

var Session = require("../models/Session");
var SessionManager = require("../models/SessionManager");

// var util = require('../helpers/util');
// var randomInteger = util.randomInteger;





// We only use one quiz ("question") at any one time
// var quizBeingUsed = quizSet[conf.fixedQuestionNumber];

var allSessions = new SessionManager();

// LTI processor for incoming logins
var ltiProcessor = new LTIProcessor(conf.lti.signingInfo);
ltiProcessor.setTestMode(conf.lti.testMode);

// Queue for instructors/tutors on standby
var backupClientQueue = new BackupClientQueue();

// Create a new pool with reference to the quiz
// being used (the question number is always fixed)
// var clientAnswerPool = new ClientAnswerPool(quizBeingUsed);

// Object(ChatGroupId{string} => ChatGroup)
var chatGroups = {};

// Object(QuizScheduleId{number} => ClientAnswerPool)
var quizSchedule_ClientAnswerPools = {};


// ===== Utils =====

/**
 * @param {string} sessionId
 */
function getClientFromSessionId(sessionId) {
    return allSessions.getSessionById(sessionId).client;
}

function getClientAnswerPoolFromSession(session) {
    return quizSchedule_ClientAnswerPools[session.quizSession._id];
}

/**
 * @param {Client} client
 */
function removeClientFromEverything(client) {
    var session = allSessions.getSessionByClient(client);
    var clientAnswerPool = getClientAnswerPoolFromSession(session);

    if (backupClientQueue.removeClient(client)) {
        broadcastBackupClientQueueStatus();
    }

    if (clientAnswerPool.removeClient(client)) {
        broadcastPoolCountToBackupQueue(clientAnswerPool);
    }

    var chatGroupIds = Object.keys(chatGroups);
    for (var i = 0; i < chatGroupIds.length; ++i) {
        var chatGroupId = chatGroupIds[i];
        var chatGroup = chatGroups[chatGroupId];
        if (chatGroup.getClientIndex(client) > -1) {
            chatGroup.removeClient(client);

            // If the chat group terminates, then remove the chat group reference
            if (chatGroup.terminationCheck()) {
                delete chatGroups[chatGroupId];
            }

            break;
        }
    }
}



// ===== Sessions =====

/**
 * @return {boolean}
 */
// function isSessionAvailable() {
//     var timezone = sessionData.timezone;
//     var sessions = sessionData.sessions;

//     var now = new Date();

//     for (var i = 0; i < sessions.length; ++i) {
//         var session = sessions[i];

//         var endDate = new Date(session.end.date + "T" + session.end.time + timezone);

//         // Skip this one if this session already concluded
//         if (endDate < now) {
//             continue;
//         }

//         var startDate = new Date(session.start.date + "T" + session.start.time + timezone);

//         if (startDate <= now && endDate >= now) {
//             return true;
//         }
//     }

//     return false;
// }

// function handleSessionAvailableCheck(data, socket) {
//     socket.emit("sessionAvailableStatus", {
//         available: isSessionAvailable()
//     });
// }

// ===== Chat group =====

/**
 * @return {ChatGroup | undefined}
 */
function formChatGroup(clientAnswerPool) {
    var newChatGroup = clientAnswerPool.tryMakeChatGroup(backupClientQueue);

    // Store reference to chat group if formed
    if (newChatGroup) {
        chatGroups[newChatGroup.id] = newChatGroup;

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
    var session = allSessions.getSessionById(data.sessionId);
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
    var client = getClientFromSessionId(data.sessionId);
    var chatGroup = chatGroups[data.groupId];

    if (data.quitStatus) {
        chatGroup.queueClientToQuit(client);
    } else {
        chatGroup.unqueueClientToQuit(client);
    }

    // If the chat group terminates, then remove the chat group reference
    if (chatGroup.terminationCheck()) {
        delete chatGroups[data.groupId];
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
    var session = allSessions.getSessionById(data.sessionId);

    var client = session.client;
    var chatGroup = chatGroups[data.groupId];

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
    // try {
    runCallbackChain(
        notifyClientOnError,
        [
            processLtiObject,
            checkUserId,
            retrieveUserId,
            findScheduledQuiz,
            setupClientAnswerPool,
            setupClient,
            writeSessionToDb,
            notifyClientOfLogin
        ]);
    // } catch (e) {
    //     socket.emit("loginFailure", e.message);
    //     return;
    // }


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

    /** {Client} */
    var client;

    /** {Session} */
    var session;

    function processLtiObject(throwErr, next) {
        ltiObject = ltiProcessor.verifyAndReturnLTIObj(data);
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
                return notifyClientOnError(err);
            }

            if (result.length > 1) {
                return notifyClientOnError(new Error("More than one user with same username detected."));
            }

            // New user
            if (result.length === 0) {
                db_wrapper.user.create({
                    _id: mongojs.ObjectId(require('crypto').randomBytes(12).toString('hex')),
                    username: ltiUsername
                }, function(err, result) {
                    if (err) {
                        return notifyClientOnError(err);
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
                return notifyClientOnError(err);
            }

            // Find first available scheduled quiz session
            if (result.length === 0) {
                return notifyClientOnError(new Error("No scheduled quizzes right now. Try again during a scheduled time."));
            }

            quizSchedule = result[0];




            // Sync on n = 2 (question + question options)
            var callbackSync = nCallbackSyncGenerator(2, next);

            db_wrapper.question.read({
                "_id": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    return notifyClientOnError(err);
                }

                if (result.length === 0) {
                    return notifyClientOnError(new Error("No question with _id = " + quizSchedule.questionId));
                }

                question = result[0];
                callbackSync();
            });

            db_wrapper.questionOption.read({
                "questionId": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    return notifyClientOnError(err);
                }

                if (result.length === 0) {
                    return notifyClientOnError(new Error("No question options for " + quizSchedule.questionId));
                }

                questionOptions = result;
                callbackSync();
            });
        });
    }

    function setupClientAnswerPool(throwErr, next) {
        var quizScheduleId = quizSchedule._id;

        if (!quizSchedule_ClientAnswerPools[quizScheduleId]) {
            var newClientAnswerPool = new ClientAnswerPool(questionOptions);
            quizSchedule_ClientAnswerPools[quizScheduleId] = newClientAnswerPool;
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
                return notifyClientOnError(err);
            }

            var sessionIdString = result._id.toString();

            // Set up session
            session = new Session(client, quizSchedule);
            session.setId(sessionIdString);
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
        });

        next();
    }
}

/**
 * data = {
 *      username {string}
 * }
 * 
 * @param {Object} data
 * @param {Socket} socket
 */
// function handleBackupClientLogin(data, socket) {
//     // TODO: Consolidate this login method with LTI login.


//     // TODO: Validate user
//     var username = data.username;

//     var loginState = {
//         success: true,
//         message: ""
//     };

//     if (allSessions.hasSessionWithUsername(username)) {
//         loginState.success = false;
//         loginState.message = "Already logged in";
//     }

//     if (!loginState.success) {
//         socket.emit("backupClientLoginState", loginState);
//         return;
//     }

//     var client = new Client();
//     client.username = username;
//     client.setSocket(socket);

//     var session = new Session(client);

//     allSessions.addSession(session);

//     // TODO: This bit of code below is only a temporary patch to support session IDs.
//     // Add session ID to loginState object

//     loginState.sessionId = session.id;

//     socket.emit("backupClientLoginState", loginState);
// }




// ===== Student client pool =====

function broadcastPoolCountToBackupQueue(clientAnswerPool) {
    backupClientQueue.broadcastEvent("clientPoolCountUpdate", {
        numberOfClients: clientAnswerPool.totalPoolSize()
    });
}



// ===== Question + answer =====

/**
 * data = {
 *      sessionId {string}
 * }
 */
// function handleQuestionContentRequest(data) {
//     var client = getClientFromSessionId(data.sessionId);

//     client.getSocket().emit("questionContent", {
//         quiz: quizBeingUsed
//     });
// }

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
function handleAnswerSubmissionInitial(data) {
    var session = allSessions.getSessionById(data.sessionId);

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
    var session = allSessions.getSessionById(data.sessionId);

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



// ===== Backup client =====

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientLogout(data) {
    var client = getClientFromSessionId(data.sessionId);
    removeClientFromEverything(client);
}

/**
 * data = {
 *      sessionId {string}
 *      answer {number}
 *      justification {string}
 * }
 */
function handleBackupClientEnterQueue(data) {
    var client = getClientFromSessionId(data.sessionId);

    // Index of the answer (0-based)
    client.probingQuestionAnswer = data.answer;
    client.probingQuestionAnswerTime = new Date().toISOString();
    client.probJustification = data.justification;

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
    var client = getClientFromSessionId(data.sessionId);

    // If 
    if (client.probingQuestionAnswer > -1 &&
        client.probingQuestionAnswerTime &&
        client.probJustification) {

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
    if (!allSessions.hasSessionId(data.sessionId)) {
        return;
    }

    broadcastBackupClientQueueStatus();
    broadcastPoolCountToBackupQueue();
    // TODO:
    console.log("[!!] TODO: FIX handleBackupClientStatusRequest: broadcastPoolCountToBackupQueue requires 1st parameter");
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientTransferConfirm(data) {
    var client = getClientFromSessionId(data.sessionId);
    var session = allSessions.getSessionById(data.sessionId);
    var clientAnswerPool = getClientAnswerPoolFromSession(session);

    if (backupClientQueue.clientOutTray && backupClientQueue.clientOutTray.client === client) {
        backupClientQueue.moveOutTrayClientToClientPool();
        chatGroupFormationLoop.run(clientAnswerPool);
    }
}

function broadcastBackupClientQueueStatus() {
    backupClientQueue.broadcastUpdate();
}



io.sockets.on('connection', function(socket) {
    /// Registration of socket event handlers

    /* On websocket disconnect */
    socket.on('disconnect', disconnect);

    /* Tracking */
    socket.on("user_flow", user_flow);

    /* Submission of answers and surveys */
    // socket.on("probingQuestionAnswerSubmission", saveProbingQuestionAnswer);
    // socket.on("probingQuestionFinalAnswerSubmission", saveProbingQuestionFinalAnswer);
    socket.on("answerSubmissionInitial", handleAnswerSubmissionInitial);
    socket.on("answerSubmissionFinal", handleAnswerSubmissionFinal);
    socket.on('submitSurvey', saveSurvey);

    /* Sessions */
    // socket.on("sessionAvailableCheck", function(data) { handleSessionAvailableCheck(data, socket) });

    /* Log ins */
    socket.on("loginLti", function(data) { handleLoginLti(data, socket); });
    // socket.on("backupClientLogin", function(data) { handleBackupClientLogin(data, socket); });

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

    // socket.on("questionContentRequest", handleQuestionContentRequest);

    /* Testing */
    // socket.on('loadTestReq', loadTest);
    // socket.on('saveLoadTestResults', saveLoadTestResults);

    // For unit test framework to know when to begin
    socket.emit('connected');

    // Makes sure all names in argNames are in data
    function checkArgs(eventName, data, argNames) {
        for (var i = 0; i < argNames.length; i++) {
            if (!(argNames[i] in data)) {
                console.log('ERROR: Missing argument: ' + argNames[i] +
                    ' in event ' + eventName);
                socket.emit('illegalMessage', 'Missing argument: ' + argNames[i] +
                    ' in event ' + eventName);
                return false;
            }
        }
        return true;
    }

    function handleException(err) {
        console.log('Unexpected exception: ' + err.message + "\n" + err.stack);
        socket.emit('illegalMessage',
            'Unexpected exception: ' + err.message + "\n" + err.stack);
    }

    // function saveProbingQuestionAnswer(data, testHooks) {
    //   saveProbingQuestionAnswerHelper(data, false, testHooks);
    // }

    function saveProbingQuestionFinalAnswer(data, testHooks) {
        saveProbingQuestionAnswerHelper(data, true, testHooks);
    }

    /**
     * data = {
     *      sessionId {string}
     *      screenName {string}
     *      quizRoomID {string}
     *      questionNumber {number}
     *      answer {number}
     *      justification {string}
     *      timestamp {string}
     * }
     */
    function saveProbingQuestionAnswerHelper(data, finalAnswer, testHooks) {
        try {
            if (!checkArgs("saveProbingQuestionAnswer", data,
                [
                    //  "username", 
                    "screenName", "questionNumber", "answer", "justification"])) return;
            var client = getClientFromSessionId(data.sessionId);
            var username = client.username;
            if (!client) return;
            var questionNumber = client.questionNumber;
            var answer = data.answer;
            var probJustification = data.justification;
            var quizRoomID = data.quizRoomID;

            client.probingQuestionAnswer = answer;
            client.probingQuestionAnswerTime = new Date().toISOString();

            var update_criteria = {
                socketID: client.getSocket().id,
                username: client.username,
                questionGroup: conf.activeQuestionGroup
            };

            // There are different document portions to update when there is a final answer 
            var update_data;
            var function_name;

            if (finalAnswer) {

                update_data = {
                    $set: {
                        probingQuestionFinalAnswer: client.probingQuestionAnswer,
                        probingQuestionFinalAnswerTime: client.probingQuestionAnswerTime,
                        probFinalJustification: probJustification
                    }
                };

                function_name = "saveProbingQuestionFinalAnswer()";

            } else {

                update_data = {
                    $set: {
                        probingQuestionAnswer: client.probingQuestionAnswer,
                        probingQuestionAnswerTime: client.probingQuestionAnswerTime,
                        probJustification: probJustification
                    }
                };

                function_name = "saveProbingQuestionAnswer()";

            }

            // Update the database 
            db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
                console.log(new Date().toISOString(), username, update_criteria, update_data);

                if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
                    testHooks.callback();
                }
                if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                    console.log("#" + function_name + " ERROR - " +
                        "username: %s", username);
                    if (err) console.log(err);
                    socket.emit('db_failure', function_name);
                }
                else {
                    console.log("#" + function_name + " - " +
                        "probing question answer and timestamps " +
                        "saved in database");
                    console.log(new Date().toISOString(), username, dbResults);
                }
            });
        }
        catch (err) {
            handleException(err);
        }
    }

    function saveSurvey(data) {
        try {
            if (!checkArgs('saveSurvey', data, [
                // 'username',
                'general', 'discussion'])) return;

            db[collections[POST_SURVEY_COLLECTION]].insert(data, function(err, dbResults) {
                if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                    console.log("#saveSurvey() ERROR");
                    if (err) console.log(err);
                    socket.emit('db_failure', 'saveSurvey()');
                }
                else {
                    console.log("#saveSurvey() - survey response saved in database");
                }
            });
        }
        catch (err) {
            handleException(err);
        }
    }

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

        var client = session.client;

        if (client) {
            removeClientFromEverything(client);
        }

        allSessions.removeSession(session);
    }

    //This records User's flow during the session
    function user_flow(data) {
        var username = data.username;
        db_wrapper.userflow.read({ 'username': data.username }, function(err, dbResults) {
            //console.log(dbResults);
            if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                console.log("#UserFlow Table ERROR doesnt exist - " +
                    "username: %s", username);
                if (err) console.log(err);
            }
            if (!err && dbResults == 0) {
                db_wrapper.userflow.create(
                    {
                        username: data.username,
                        events: [
                            {
                                timestamp: data.timestamp,
                                page: data.page,
                                event: data.event,
                                data: data.data
                            }
                        ]
                    }, function(err, res) {

                    });
            }

            else {
                db_wrapper.userflow.update(
                    { username: data.username },
                    {
                        $addToSet: {
                            events: {
                                $each: [
                                    {
                                        timestamp: data.timestamp,
                                        event: data.event,
                                        page: data.page,
                                        data: data.data
                                    }
                                ]
                            }
                        }
                    }
                )

            }

        });


    }

});

console.log("All websocket events registered.");