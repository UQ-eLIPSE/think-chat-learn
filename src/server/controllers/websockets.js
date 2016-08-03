var conf = global.conf;
var io = global.io;

var mongojs = require("mongojs");
var db_wrapper = require("./database");

var LTIProcessor = require("../models/LTIProcessor").LTIProcessor;

// var Client = require('../models/client');

// var ClientAnswerPool = require("../models/ClientAnswerPool");
// var ChatGroup = require("../models/ChatGroup");
// var BackupClientQueue = require("../models/BackupClientQueue");

// var Session = require("../models/Session");
// var SessionManager = require("../models/SessionManager");

// var util = require('../helpers/util');
// var randomInteger = util.randomInteger;



// Replacement code for previous session/client classes
var MoocchatUserSession = require("../models/MoocchatUserSession").MoocchatUserSession;
var MoocchatWaitPool = require("../models/MoocchatWaitPool").MoocchatWaitPool;
var MoocchatChatGroup = require("../models/MoocchatChatGroup").MoocchatChatGroup;
var MoocchatBackupClientQueue = require("../models/MoocchatBackupClientQueue").MoocchatBackupClientQueue;




// var allSessions = new SessionManager();

// LTI processor for incoming logins
var ltiProcessor = new LTIProcessor(conf.lti.signingInfo);
ltiProcessor.setTestMode(conf.lti.testMode);


// Mappings between quiz schedule ID and the different groups and queues used

/** Object(QuizScheduleId{string} => BackupClientQueue) */
// var quizSchedule_BackupClientQueue = {};

/** Object(QuizScheduleId{string} => ClientAnswerPool) */
// var quizSchedule_ClientAnswerPool = {};

/** Object(QuizScheduleId{string} => ChatGroup[]) */
// var quizSchedule_ChatGroupArray = {};




// ===== Utils =====

/**
 * @param {string} sessionId
 */
// function getSessionFromId(sessionId) {
//     return allSessions.getSessionById(sessionId);
// }

/**
 * Gets associated client answer pool for a given user session's quiz session.
 * 
 * @param {Session} session
 * 
 * @returns {ClientAnswerPool}
 */
// function getClientAnswerPoolFromSession(session) {
//     return quizSchedule_ClientAnswerPool[session.getQuizScheduleIdString()];
// }

/**
 * Gets associated backup client queue for a given user session's quiz session.
 * 
 * @param {Session} session
 * 
 * @returns {BackupClientQueue}
 */
// function getBackupClientQueueFromSession(session) {
//     return quizSchedule_BackupClientQueue[session.getQuizScheduleIdString()];
// }

/**
 * Gets associated chat groups for a given user session's quiz session.
 * 
 * @param {Session} session
 * 
 * @returns {ChatGroup[]}
 */
// function getChatGroupsFromSession(session) {
//     return quizSchedule_ChatGroupArray[session.getQuizScheduleIdString()];
// }

/**
 * Gets the chat group the user is located in.
 * 
 * @param {Session} session
 */
// function getChatGroupFromSession(session) {
//     var chatGroups = getChatGroupsFromSession(session);

//     if (!chatGroups) {
//         return;
//     }

//     var client = session.client;

//     for (var i = 0; i < chatGroups.length; ++i) {
//         var chatGroup = chatGroups[i];

//         if (chatGroup.getClientIndex(client) > -1) {
//             return chatGroup;
//         }
//     }
// }

/**
 * Deletes given chat group from mapping store.
 * 
 * @param {Session} session Session of user in/previously in chat group
 * @param {ChatGroup} chatGroupToDelete
 */
// function deleteChatGroupFromMappingStore(session, chatGroupToDelete) {
//     var allChatGroupsInQuiz = getChatGroupsFromSession(session);
//     var chatGroupIndex = allChatGroupsInQuiz.indexOf(chatGroupToDelete);

//     if (chatGroupIndex > -1) {
//         return allChatGroupsInQuiz.splice(chatGroupIndex, 1);
//     }
// }

/**
 * @param {Client} client
 */
// function removeClientFromEverything(client) {
//     var session = allSessions.getSessionByClient(client);

//     var clientAnswerPool = getClientAnswerPoolFromSession(session);
//     var backupClientQueue = getBackupClientQueueFromSession(session);
//     var chatGroup = getChatGroupFromSession(session);

//     if (backupClientQueue && backupClientQueue.removeClient(client)) {
//         backupClientQueue.broadcastUpdate();
//     }

//     if (clientAnswerPool && clientAnswerPool.removeClient(client)) {
//         broadcastPoolCountToBackupQueue(clientAnswerPool);
//     }

//     if (chatGroup && chatGroup.removeClient(client)) {
//         // If the chat group terminates, then remove the chat group from array
//         if (chatGroup.terminationCheck()) {
//             deleteChatGroupFromMappingStore(session, chatGroup);
//         }
//     }
// }



// ===== Chat group =====

/**
 * @return {ChatGroup | undefined}
 */
// function formChatGroup(clientAnswerPool) {
//     var newChatGroup = clientAnswerPool.tryMakeChatGroup();

//     if (newChatGroup) {
//         var quizScheduleIdString = newChatGroup.clients[0].getSession().getQuizScheduleIdString();

//         quizSchedule_ChatGroupArray[quizScheduleIdString].push(newChatGroup);

//         newChatGroup.clients.forEach(function(client) {
//             db_wrapper.userSession.update({
//                 _id: mongojs.ObjectId(client.getSession().getId())
//             },
//                 {
//                     $set: {
//                         chatGroupId: newChatGroup.id
//                     }
//                 });
//         });

//         broadcastPoolCountToBackupQueue(clientAnswerPool);

//         return newChatGroup;
//     }
// }



// Recurring task
var chatGroupFormationLoop = (function() {
    var timeBetweenChecks = conf.chat.groups.formationIntervalMs;
    var timeoutHandles = {};

    /**
     * Runs another round of the loop, or starts the loop if not already active.
     * 
     * @param {MoocchatWaitPool} waitPool
     */
    function run(waitPool) {
        clearTimeout(timeoutHandles[waitPool.getQuizSessionId()]);

        var sessionsInGroup = waitPool.tryFormGroup();

        if (sessionsInGroup && sessionsInGroup.length > 0) {
            // Form chat group
            var newChatGroup = new MoocchatChatGroup(sessionsInGroup);

            // Record
            newChatGroup.getSessions().forEach(function(session) {
                db_wrapper.userSession.update(
                    {
                        _id: mongojs.ObjectId(session.getId())
                    },
                    {
                        $set: {
                            chatGroupId: newChatGroup.getId()
                        }
                    });
            });

            // Update backup clients about this
            broadcastPoolCountToBackupQueue__WaitPool(waitPool);

            // Process next group at next available timeslot
            setImmediate(run, waitPool);
        } else {
            timeoutHandles[waitPool.getQuizSessionId()] =
                setTimeout(run, timeBetweenChecks, waitPool);
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
function handleChatGroupJoinRequest(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted chat group join request with invalid session ID = " + data.sessionId);
    }

    var waitPool = MoocchatWaitPool.GetPoolWith(session);
    waitPool.addSession(session);

    broadcastPoolCountToBackupQueue__WaitPool(waitPool);
    chatGroupFormationLoop.run(waitPool);
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
function handleChatGroupQuitStatusChange(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted chat group quit request with invalid session ID = " + data.sessionId);
    }

    var chatGroup = MoocchatChatGroup.GetChatGroupWith(session);

    if (data.quitStatus) {
        chatGroup.quitSession(session);
    } else {
        // chatGroup.unqueueClientToQuit(session);
    }

    // var chatGroup = getChatGroupFromSession(session);

    // if (data.quitStatus) {
    //     chatGroup.queueClientToQuit(client);
    // } else {
    //     chatGroup.unqueueClientToQuit(client);
    // }

    // // If the chat group terminates, then remove the chat group reference
    // if (chatGroup.terminationCheck()) {
    //     deleteChatGroupFromMappingStore(session, chatGroup);
    // }
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
function handleChatGroupMessage(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted chat group message from invalid session ID = " + data.sessionId);
    }

    var chatGroup = MoocchatChatGroup.GetChatGroupWith(session);

    db_wrapper.chatMessage.create({
        content: data.message,
        sessionId: mongojs.ObjectId(session.getId()),
        timestamp: new Date()
    });

    chatGroup.broadcastMessage(session, data.message);
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
        socketEmitWithLogging(socket, "loginFailure", (err && err.message) ? err.message : "Unexpected error");
    }

    // Callback chain
    runCallbackChain(
        notifyClientOnError,
        [
            processLtiObject,
            checkUserId,
            retrieveUserId,
            checkNoActiveSession,
            findScheduledQuiz,
            checkQuizSessionNotTaken,
            loadQuestionData,
            findSurvey,
            setupPoolsAndQueues,
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

    function callbackSyncFactory(n, done) {
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

    /** {Mongo.ObjectId()} */
    var userObjectId;

    /** {IDB_QuizSchedule} */
    var quizSchedule;

    /** {IDB_Question} */
    var question;

    /** {IDB_QuestionOption[]} */
    var questionOptions;

    /** {IDB_Survey} */
    var survey;

    /** {Client} */
    // var client;

    /** {MoocchatUserSession} */
    var session;

    /** {boolean} */
    var researchConsentUnknown;

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
            return throwErr(new Error("[10] No user ID received."));
        }

        next();
    }

    function retrieveUserId(throwErr, next) {
        db_wrapper.user.read({ username: ltiUsername }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            if (result.length > 1) {
                return throwErr(new Error("[11] More than one user with same username '" + ltiUsername + "' detected."));
            }

            // New user
            if (result.length === 0) {
                var ltiFirstName = ltiObject.lis_person_name_given || "";
                var ltiLastName = ltiObject.lis_person_name_family || "";

                db_wrapper.user.create({
                    _id: mongojs.ObjectId(require('crypto').randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
                    username: ltiUsername,

                    firstName: ltiFirstName,
                    lastName: ltiLastName,

                    researchConsent: null
                }, function(err, result) {
                    if (err) {
                        return throwErr(err);
                    }

                    userObjectId = result._id;
                    researchConsentUnknown = true;
                    next();
                });

                return;
            }

            // Existing user
            userObjectId = result[0]._id;

            if (result[0].researchConsent === false || result[0].researchConsent === true) {
                // Research consent value has been set previously
                researchConsentUnknown = false;
            } else {
                researchConsentUnknown = true;
            }

            next();
        });
    }

    function checkNoActiveSession(throwErr, next) {
        var session = MoocchatUserSession.GetSessionWith(userObjectId.toString());

        if (session) {
            return throwErr(new Error("[20] The user '" + ltiUsername + "' is currently in an active session."));
        }

        next();
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
                return throwErr(new Error("[30] No scheduled quiz found."));
            }

            quizSchedule = result[0];

            next();
        });
    }

    function checkQuizSessionNotTaken(throwErr, next) {
        // A session is considered to have been taken if a user
        // successfully fills in an initial AND final answer response
        // for this quiz session
        db_wrapper.userSession.read({
            userId: userObjectId,
            quizScheduleId: quizSchedule._id,
            responseInitialId: { $ne: null },
            responseFinalId: { $ne: null }
        }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            if (result.length > 0) {
                return throwErr(new Error("[21] User '" + ltiUsername + "' has previously completed the current quiz session."));
            }

            next();
        });
    }

    function loadQuestionData(throwErr, next) {
        // Sync on n = 2 (question + question options)
        var callbackSync = callbackSyncFactory(2, next);

        db_wrapper.question.read({
            "_id": quizSchedule.questionId
        }, function(err, result) {
            if (err) {
                return throwErr(err);
            }

            if (result.length === 0) {
                return throwErr(new Error("[50] No question with _id = " + quizSchedule.questionId));
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
                return throwErr(new Error("[51] No question options for question ID = " + quizSchedule.questionId));
            }

            questionOptions = result;
            callbackSync();
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
                return throwErr(new Error("[52] No survey available at this time. Survey required for MOOCchat to operate."));
            }

            survey = result[0];

            next();
        });
    }

    function setupPoolsAndQueues(throwErr, next) {
        // var quizScheduleIdString = quizSchedule._id.toString();

        // if (!quizSchedule_BackupClientQueue[quizScheduleIdString] &&
        //     !quizSchedule_ClientAnswerPool[quizScheduleIdString] &&
        //     !quizSchedule_ChatGroupArray[quizScheduleIdString]) {
        //     var newBackupClientQueue = new BackupClientQueue();
        //     var newClientAnswerPool = new ClientAnswerPool(questionOptions, newBackupClientQueue);

        //     quizSchedule_BackupClientQueue[quizScheduleIdString] = newBackupClientQueue;
        //     quizSchedule_ClientAnswerPool[quizScheduleIdString] = newClientAnswerPool;
        //     quizSchedule_ChatGroupArray[quizScheduleIdString] = [];     // Empty array to be filled in when chat groups form later down the track

        //     chatGroupFormationLoop.run(newClientAnswerPool);
        // }

        next();
    }

    function setupClient(throwErr, next) {
        // client = new Client();
        // client.userId = userObjectId.toString();
        // client.username = ltiUsername;
        // client.setSocket(socket);

        next();
    }

    function writeSessionToDb(throwErr, next) {
        db_wrapper.userSession.create({
            _id: mongojs.ObjectId(require('crypto').randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
            userId: userObjectId,

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
            session = new MoocchatUserSession(socket, userObjectId.toString(), sessionIdString);
            session.initSessionData(
                quizSchedule,
                question,
                questionOptions,
                survey,
                ltiUsername
            );

            next();
        });
    }

    function notifyClientOfLogin(throwErr, next) {
        // Complete login by notifying client
        socketEmitWithLogging(socket, 'loginSuccess', {
            sessionId: session.getId(),
            username: ltiUsername,
            quiz: {
                quizSchedule: quizSchedule,
                question: question,
                questionOptions: questionOptions
            },
            survey: survey,
            researchConsentRequired: researchConsentUnknown
        });

        next();
    }
}

function handleLogout(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted logout with invalid session ID = " + data.sessionId);
    }

    var sessionId = session.getId();

    db_wrapper.userSession.update(
        {
            _id: mongojs.ObjectId(sessionId)
        },
        {
            $set: {
                timestampEnd: new Date()
            }
        },
        function(err, result) {
            if (err) {
                return console.error(err);
            }

            socketEmitWithLogging(socket, "logoutSuccess", {
                sessionId: sessionId
            });

            // Destroy session
            MoocchatUserSession.Destroy(session);
        });
}

function handleTerminateSessions(data, socket) {
    var username = data.username;

    if (!username || typeof username !== "string") {
        return;
    }

    db_wrapper.user.read(
        {
            username: username
        },
        function(err, result) {
            if (err) {
                return;
            }

            if (result.length === 0) {
                return;
            }

            var user = result[0];
            var userIdString = user._id.toString();

            console.log("Destroying all sessions with username '" + username + "'; user ID '" + userIdString + "'");

            var session;
            while (session = MoocchatUserSession.GetSessionWith(userIdString)) {
                MoocchatUserSession.Destroy(session, true);
            }

            socket.emit("terminateSessionsComplete");
        });
}

function handleResearchConsentSet(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted research consent set with invalid session ID = " + data.sessionId);
    }

    var researchConsent = data.researchConsent;

    if (!(researchConsent === false || researchConsent === true)) {
        return;
    }

    db_wrapper.user.update(
        {
            _id: mongojs.ObjectId(session.getUserId())
        },
        {
            $set: {
                researchConsent: researchConsent
            }
        },
        function(err, result) {
            if (err) {
                return console.error(err);
            }

            socketEmitWithLogging(socket, "researchConsentSaved");
        });
}

// ===== Student client pool =====

// function broadcastPoolCountToBackupQueue(clientAnswerPool) {
//     clientAnswerPool.backupClientQueue.broadcastEvent("clientPoolCountUpdate", {
//         numberOfClients: clientAnswerPool.totalPoolSize()
//     });
// }

function broadcastPoolCountToBackupQueue__WaitPool(waitPool) {
    var quizSessionId = waitPool.getQuizSessionId();

    var backupClientQueue = MoocchatBackupClientQueue.GetQueue(quizSessionId);

    backupClientQueue.broadcast("clientPoolCountUpdate", {
        numberOfClients: waitPool.getSize()
    });
}


// ===== Question + answer =====

function answerSubmissionHandlerFactory(answerType) {
    return function(data, socket) {
        var session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted answer submission with invalid session ID = " + data.sessionId);
        }

        var optionIdString = data.optionId;
        var justification = data.justification;

        /** Holds reference to the answer object (depends on `answerType`) */
        var sessionAnswerObj;

        /** String for websocket event to be sent on success */
        var onSuccessWebsocketEvent;

        /** Function for generating the update set depending on `answerType` */
        var generateUpdateSet;

        switch (answerType) {
            case "initial":
                sessionAnswerObj = session.data.response.initial;
                onSuccessWebsocketEvent = "answerSubmissionInitialSaved";
                generateUpdateSet = function(questionResponseObjectId) {
                    return {
                        responseInitialId: questionResponseObjectId
                    }
                }
                break;

            case "final":
                sessionAnswerObj = session.data.response.final;
                onSuccessWebsocketEvent = "answerSubmissionFinalSaved";
                generateUpdateSet = function(questionResponseObjectId) {
                    return {
                        responseFinalId: questionResponseObjectId
                    }
                }
                break;

            default:
                throw new Error("Unrecogised answer type");
        }

        // Check that option ID is valid for session
        if (optionIdString &&
            session.data.quizQuestionOptions
                .map(function(option) { return option._id.toString(); })
                .indexOf(optionIdString) < 0) {
            return;
        }

        db_wrapper.questionResponse.create({
            optionId: (optionIdString ? mongojs.ObjectId(optionIdString) : null),
            justification: justification,
            timestamp: new Date()
        }, function(err, result) {
            if (err) {
                return console.error(err);
            }

            var questionResponseObjectId = result._id;

            // Sets the OBJECT that is being held in session.data.response.*
            sessionAnswerObj._id = questionResponseObjectId;
            sessionAnswerObj.optionId = mongojs.ObjectId(optionIdString);
            sessionAnswerObj.justification = justification;

            db_wrapper.userSession.update(
                {
                    _id: mongojs.ObjectId(session.getId())
                },
                {
                    $set: generateUpdateSet(questionResponseObjectId)
                },
                function(err, result) {
                    if (err) {
                        return console.error(err);
                    }

                    socketEmitWithLogging(socket, onSuccessWebsocketEvent);
                });
        });
    }
}

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
var handleAnswerSubmissionInitial = answerSubmissionHandlerFactory("initial");

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
var handleAnswerSubmissionFinal = answerSubmissionHandlerFactory("final");



/**
 * data = {
 *      sessionId {string}
 *      content {IDB_SurveyResponse_Content[]}
 * }
 */
function saveSurvey(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted survey submission with invalid session ID = " + data.sessionId);
    }

    db_wrapper.surveyResponse.create({
        sessionId: mongojs.ObjectId(session.getId()),
        surveyId: mongojs.ObjectId(session.data.survey._id),
        timestamp: new Date(),
        content: data.content
    });
}





// ===== Backup client =====

/**
 * data = {
 *      sessionId {string}
 * }
 */
// function handleBackupClientLogout(data, _socket) {
//     var session = getSessionFromId(data.sessionId);

//     if (!session) {
//         return;
//     }

//     var client = session.client;

//     removeClientFromEverything(client);
// }

/**
 * data = {
 *      sessionId {string}
 *      optionId {string}
 *      justification {string}
 * }
 */
function handleBackupClientEnterQueue(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted backup client enter queue with invalid session ID = " + data.sessionId);
    }

    // Fake a database entry with question response data
    session.data.response.initial.optionId = mongojs.ObjectId(data.optionId);
    session.data.response.initial.justification = data.justification;

    // Add the client to the backup queue here, only *after* we
    // have all the information for question/answer
    var backupClientQueue = MoocchatBackupClientQueue.GetQueueWith(session);

    if (backupClientQueue) {
        backupClientQueue.addSession(session);
    }
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientReturnToQueue(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted backup client return to queue with invalid session ID = " + data.sessionId);
    }

    // If session already has answer then return to queue
    if (!(session.data.initial.response.optionId && session.data.initial.response.justification)) {
        return;
    }

    var backupClientQueue = MoocchatBackupClientQueue.GetQueueWith(session);

    if (backupClientQueue) {
        backupClientQueue.addSession(session);
    }
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
function handleBackupClientStatusRequest(data, socket) {
    var session = MoocchatUserSession.GetSession(data.sessionId, socket);

    if (!session) {
        return console.error("Attempted backup client status request with invalid session ID = " + data.sessionId);
    }

    var backupClientQueue = MoocchatBackupClientQueue.GetQueueWith(session);

    if (backupClientQueue) {
        backupClientQueue.broadcastQueueChange();

        var waitPool = MoocchatWaitPool.GetPoolWith(session);

        if (waitPool) {
            broadcastPoolCountToBackupQueue__WaitPool(waitPool);
        }
    }
}

/**
 * data = {
 *      sessionId {string}
 * }
 */
// function handleBackupClientTransferConfirm(data, _socket) {
//     var session = getSessionFromId(data.sessionId);

//     if (!session) {
//         return;
//     }

//     var backupClientQueue = getBackupClientQueueFromSession(session);
//     var clientAnswerPool = getClientAnswerPoolFromSession(session);
//     var client = session.client;

//     if (backupClientQueue.clientOutTray && backupClientQueue.clientOutTray.client === client) {
//         backupClientQueue.moveOutTrayClientToClientPool();
//         chatGroupFormationLoop.run(clientAnswerPool);
//     }
// }











// Socket logging receive/emit proxy functions

function registerSocketEventWithLoggingFactory(socket) {
    var eventList = [];

    return function(event, handler) {
        if (eventList.indexOf(event) < 0) {
            socket.on(event, function(data) {
                var loggedData = [
                    'socket.io' + socket.id,
                    'INBOUND',
                    '[' + event + ']'
                ];

                if (typeof data !== "undefined") {
                    loggedData.push(data);
                }

                console.log.apply(undefined, loggedData);
            });

            eventList.push(event);
        }

        socket.on(event, handler);
    }
}

function socketEmitWithLogging(socket, event, data) {
    var loggedData = [
        'socket.io' + socket.id,
        'OUTBOUND',
        '[' + event + ']'
    ];

    if (typeof data !== "undefined") {
        loggedData.push(data);
    }

    console.log.apply(undefined, loggedData);

    socket.emit(event, data);
}

io.sockets.on('connection', function(socket) {
    /// Registration of socket event handlers
    var registerSocketEventWithLogging = registerSocketEventWithLoggingFactory(socket);

    /* On websocket disconnect */
    registerSocketEventWithLogging('disconnect', disconnect);

    /* Submission of answers and surveys */
    registerSocketEventWithLogging("answerSubmissionInitial", function(data) { handleAnswerSubmissionInitial(data, socket); });
    registerSocketEventWithLogging("answerSubmissionFinal", function(data) { handleAnswerSubmissionFinal(data, socket); });
    registerSocketEventWithLogging("submitSurvey", function(data) { saveSurvey(data, socket); });

    /* Log ins */
    registerSocketEventWithLogging("loginLti", function(data) { handleLoginLti(data, socket); });
    registerSocketEventWithLogging("researchConsentSet", function(data) { handleResearchConsentSet(data, socket); });
    registerSocketEventWithLogging("logout", function(data) { handleLogout(data, socket); });
    registerSocketEventWithLogging("terminateSessions", function(data) { handleTerminateSessions(data, socket); });
    /* Chat group discussion */
    registerSocketEventWithLogging("chatGroupJoinRequest", function(data) { handleChatGroupJoinRequest(data, socket); });
    registerSocketEventWithLogging("chatGroupMessage", function(data) { handleChatGroupMessage(data, socket); });
    registerSocketEventWithLogging("chatGroupQuitStatusChange", function(data) { handleChatGroupQuitStatusChange(data, socket); });

    /* Backup client */
    // registerSocketEventWithLogging("backupClientLogout", function(data) { handleBackupClientLogout(data, socket); });
    registerSocketEventWithLogging("backupClientEnterQueue", function(data) { handleBackupClientEnterQueue(data, socket); });
    registerSocketEventWithLogging("backupClientReturnToQueue", function(data) { handleBackupClientReturnToQueue(data, socket); });
    registerSocketEventWithLogging("backupClientStatusRequest", function(data) { handleBackupClientStatusRequest(data, socket); });

    // No longer done here; see MoocchatBackupClientQueue#callToPool()
    // registerSocketEventWithLogging("backupClientTransferConfirm", function(data) { handleBackupClientTransferConfirm(data, socket); });

    /* Testing */
    // socket.on('loadTestReq', loadTest);
    // socket.on('saveLoadTestResults', saveLoadTestResults);

    // Signal back to client/test framework that socket is connected
    socketEmitWithLogging(socket, 'connected');




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
        // Disconnects no longer cleans sessions, only explicit logouts do.
        // ----> See handleLogout().


        // var session = allSessions.getSessionBySocket(socket);

        // // No session = no action to do
        // if (!session) {
        //     return;
        // }

        // // Clean up pools, queues, chats
        // var client = session.client;

        // if (client) {
        //     removeClientFromEverything(client);
        // }

        // var clientAnswerPool = getClientAnswerPoolFromSession(session);
        // var backupClientQueue = getBackupClientQueueFromSession(session);
        // var chatGroups = getChatGroupsFromSession(session);

        // if (clientAnswerPool && clientAnswerPool.totalPoolSize() === 0 &&
        //     backupClientQueue && backupClientQueue.getQueueSize() === 0 &&
        //     chatGroups && chatGroups.length === 0) {
        //     delete quizSchedule_ClientAnswerPool[session.getQuizScheduleIdString()];
        //     delete quizSchedule_BackupClientQueue[session.getQuizScheduleIdString()];
        //     delete quizSchedule_ChatGroupArray[session.getQuizScheduleIdString()];
        // }

        // // Remove session and update session entry in DB
        // allSessions.removeSession(session);

        // db_wrapper.userSession.update(
        //     {
        //         _id: mongojs.ObjectId(session.getId())
        //     },
        //     {
        //         $set: {
        //             timestampEnd: new Date()
        //         }
        //     });
    }
});

console.log("All websocket events registered.");