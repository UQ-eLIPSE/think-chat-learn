// var app = global.app;
var conf = global.conf;
var io = global.io;

var sessionData = require('../../config/sessions.json');

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
        broadcastPoolCountToBackupQueue();
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
function isSessionAvailable() {
    var timezone = sessionData.timezone;
    var sessions = sessionData.sessions;

    var now = new Date();

    for (var i = 0; i < sessions.length; ++i) {
        var session = sessions[i];

        var endDate = new Date(session.end.date + "T" + session.end.time + timezone);

        // Skip this one if this session already concluded
        if (endDate < now) {
            continue;
        }

        var startDate = new Date(session.start.date + "T" + session.start.time + timezone);

        if (startDate <= now && endDate >= now) {
            return true;
        }
    }

    return false;
}

function handleSessionAvailableCheck(data, socket) {
    socket.emit("sessionAvailableStatus", {
        available: isSessionAvailable()
    });
}

// ===== Chat group =====

/**
 * @return {ChatGroup | undefined}
 */
function formChatGroup(clientAnswerPool) {
    var newChatGroup = clientAnswerPool.tryMakeChatGroup(backupClientQueue);

    // Store reference to chat group if formed
    if (newChatGroup) {
        chatGroups[newChatGroup.id] = newChatGroup;

        broadcastPoolCountToBackupQueue();

        return newChatGroup;
    }
}

// Recurring task
// TODO: Have a library/package handle this task in a different thread?    
var chatGroupFormationLoop = (function() {
    var timeBetweenChecks = conf.chat.groups.formationIntervalMs;
    var timeoutHandle;



    /**
     * Runs another round of the loop, or starts the loop if not already active.
     */
    function run(clientAnswerPool) {
        clearTimeout(timeoutHandle);

        var newChatGroup = formChatGroup(clientAnswerPool);

        if (newChatGroup) {
            setImmediate(run, clientAnswerPool);   // Process next group at next available timeslot
        } else {
            timeoutHandle = setTimeout(run, timeBetweenChecks, clientAnswerPool);
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
    var client = getClientFromSessionId(data.sessionId);
    var session = allSessions.getSessionById(data.sessionId);
    var clientAnswerPool = getClientAnswerPoolFromSession(session);

    clientAnswerPool.addClient(client);

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
    var client = getClientFromSessionId(data.sessionId);
    var chatGroup = chatGroups[data.groupId];
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
    function runCallbackChain(chain) {
        var chainIndex = -1;

        var callbackChainer = function() {
            var nextCallback = chain[++chainIndex];
            if (!nextCallback) { return; }
            nextCallback(callbackChainer);
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

    // Callback chain
    try {
        runCallbackChain([
            processLtiObject,
            checkUserId,
            retrieveUuid,
            findScheduledQuiz,
            setupClientAnswerPool,
            setupClient,
            writeSessionToDb,
            notifyClientOfLogin
        ]);
    } catch (e) {
        socket.emit("loginFailure", e.message);
        return;
    }

    // Variables in serialised callback chain

    /** {ILTIData} */
    var ltiObject;

    /** {string} */
    var user_id;

    /** {string} */
    var uuid;

    /** {Object(QuizSchedule)} */
    var quizSchedule;

    /** {Object(Question)} */
    var question;

    /** {Object(QuestionOption)[]} */
    var questionOptions;

    /** {Client} */
    var client;

    /** {Session} */
    var session;

    function processLtiObject(nextFunc) {
        ltiObject = ltiProcessor.verifyAndReturnLTIObj(data);
        nextFunc();
    }

    function checkUserId(nextFunc) {
        user_id = ltiObject.user_id;

        if (!user_id) {
            throw new Error('No user ID received.');
        }

        if (allSessions.hasSessionWithUsername(user_id)) {
            throw new Error('The username is being used.');
        }

        nextFunc();
    }

    function retrieveUuid(nextFunc) {
        db_wrapper.user.read({ username: user_id }, function(err, result) {
            if (err) {
                throw err;
            }

            if (result.length > 1) {
                throw new Error("More than one user with same username detected.");
            }

            // New user
            if (result.length === 0) {
                uuid = require('crypto').randomBytes(16).toString('hex');

                db_wrapper.user.create({
                    uuid: uuid,
                    username: user_id
                }, function(err, result) {
                    if (err) {
                        throw err;
                    }

                    nextFunc();
                });
            }

            uuid = result[0].uuid;
            nextFunc();
        });
    }

    function findScheduledQuiz(nextFunc) {
        var now = new Date();

        db_wrapper.quizSchedule.read({
            "availableStart": { "$lte": now },
            "availableEnd": { "$gte": now }
        }, function(err, result) {
            if (err) {
                throw err;
            }

            // Find first available scheduled quiz session
            if (result.length === 0) {
                throw new Error("No scheduled quizzes");
            }

            quizSchedule = result[0];




            // Sync on n = 2 (question + question options)
            var callbackSync = nCallbackSyncGenerator(2, nextFunc);

            db_wrapper.question.read({
                "_id": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                if (result.length === 0) {
                    throw new Error("No question with _id = " + quizSchedule.questionId);
                }

                question = result[0].content;
                callbackSync();
            });

            db_wrapper.questionOption.read({
                "questionId": quizSchedule.questionId
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                if (result.length === 0) {
                    throw new Error("No question options for " + quizSchedule.questionId);
                }

                questionOptions = result;
                callbackSync();
            });
        });
    }

    function setupClientAnswerPool(nextFunc) {
        var quizScheduleId = quizSchedule._id;

        if (!quizSchedule_ClientAnswerPools[quizScheduleId]) {
            var newClientAnswerPool = new ClientAnswerPool(questionOptions.length);
            quizSchedule_ClientAnswerPools[quizScheduleId] = newClientAnswerPool;
            chatGroupFormationLoop.run(newClientAnswerPool);
        }

        nextFunc();
    }

    function setupClient(nextFunc) {
        client = new Client();
        client.uuid = uuid;
        client.username = user_id;
        client.setSocket(socket);

        session = new Session(client, quizSchedule);
        session.setQuizQuestion(question);
        session.setQuizQuestionOptions(questionOptions);

        allSessions.addSession(session);

        // Determine if person has elevated permissions
        var hasElevatedPermissions = false;
        var roles = ltiObject.roles.toLowerCase().split(",");

        if (roles.indexOf("instructor") > -1 ||
            roles.indexOf("mentor") > -1 ||
            roles.indexOf("teachingassistant") > -1 ||
            roles.indexOf("administrator") > -1) {
            hasElevatedPermissions = true;
        }

        if (hasElevatedPermissions) {
            session.setElevatedPermissions(true);
        }

        nextFunc();
    }

    function writeSessionToDb(nextFunc) {
        db_wrapper.userSession.create({
            userUuid: uuid,
            timestampStart: new Date()
        }, function(err, result) {
            if (err) {
                throw err;
            }

            nextFunc();
        });
    }

    function notifyClientOfLogin() {
        // Complete login by notifying client
        socket.emit('loginSuccess', {
            sessionId: session.id,
            username: client.username,
            hasElevatedPermissions: session.hasElevatedPermissions,
            quiz: {
                quizSchedule: quizSchedule,
                question: question,
                questionOptions: questionOptions
            },
        });
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
 *      questionId {number|string?}     // Not used, hard coded question number presently
 *      answer {number|string?}
 *      justification {string}
 * }
 */
function handleAnswerSubmissionInitial(data) {
    var client = getClientFromSessionId(data.sessionId);
    var username = client.username;
    var answer = data.answer;
    var justification = data.justification;

    var socket = client.getSocket();

    // For some reason the last known answer is stored with the client...
    // Carried over from saveProbingQuestionAnswerHelper()
    client.probingQuestionAnswer = answer;
    client.probingQuestionAnswerTime = new Date().toISOString();
    client.probJustification = justification;

    var update_criteria = {
        socketID: socket.id,
        username: client.username,
        questionGroup: conf.activeQuestionGroup
    };

    var update_data = {
        $set: {
            probingQuestionAnswer: client.probingQuestionAnswer,
            probingQuestionAnswerTime: client.probingQuestionAnswerTime,
            probJustification: justification
        }
    };

    db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {

        console.log(new Date().toISOString(), username, update_criteria, update_data);

        if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
            testHooks.callback();
        }
        if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
            console.log("#handleAnswerSubmissionInitial() ERROR - " +
                "username: %s", username);
            if (err) console.log(err);
            socket.emit('db_failure', 'handleAnswerSubmissionInitial()');
        }
        else {
            console.log("#handleAnswerSubmissionInitial() - " +
                "probing question answer and timestamps " +
                "saved in database");
            console.log(new Date().toISOString(), username, dbResults);

            socket.emit("answerSubmissionInitialSaved");
        }
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
    socket.on("answerSubmissionInitial", handleAnswerSubmissionInitial);
    socket.on("probingQuestionFinalAnswerSubmission", saveProbingQuestionFinalAnswer);
    socket.on('submitSurvey', saveSurvey);

    /* Sessions */
    socket.on("sessionAvailableCheck", function(data) { handleSessionAvailableCheck(data, socket) });

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