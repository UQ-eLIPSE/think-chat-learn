var app = global.app;
var conf = global.conf;
var io = global.io;

var db_wrapper = require('./database.js');

var _LTI = require("./LTI");
var LTIProcessor = _LTI.LTIProcessor;

var Client = require('../models/client');

var DiscussionRoom = require('../models/discussionRoom');
var QuizRoom = require('../models/quizRoom');

var ClientAnswerPool = require("../models/ClientAnswerPool");
var ChatGroup = require("../models/ChatGroup");
var BackupClientQueue = require("../models/BackupClientQueue");

var Session = require("../models/Session");
var SessionManager = require("../models/SessionManager");

var util = require('../helpers/util');
var randomInteger = util.randomInteger;


/**
 * Holds the quiz information for each question
 * Type: {[questionNumber: number]: Quiz}
 */
var quizSet = {};

console.log("Active question group: " + conf.activeQuestionGroup);

db_wrapper.question.read({ questionGroup: conf.activeQuestionGroup },
    function(err, dbResults) {
        // Load up the quiz information
        for (var i = 0; i < dbResults.length; i++) {
            quizSet[dbResults[i].questionNumber] = dbResults[i];
        }

        //  initializes the right number (for questions) of empty
        //  waitlists for users
        console.log("#MOOCchat server has started\n" +
            "\tport: %d\n" +
            "\tgroup size: %d\n" +
            "\ttotal number of questions in DB: %d\n" +
            "\tactive question group: %d\n",
            conf.portNum,
            conf.chat.groups.desiredSize,
            dbResults.length,
            conf.activeQuestionGroup);

        // Run initialisation
        afterDbLoad();
    });

/**
 * Wrapping everything in a "after DB load" function
 * so that we're sure some variables are initialised properly when we use them
 */
function afterDbLoad() {
    // We only use one quiz ("question") at any one time
    var quizBeingUsed = quizSet[conf.fixedQuestionNumber];

    var allSessions = new SessionManager();
    
    // LTI processor for incoming logins
    var ltiProcessor = new LTIProcessor(conf.lti.signingInfo);
    ltiProcessor.setTestMode(conf.lti.testMode);

    // Queue for instructors/tutors on standby
    var backupClientQueue = new BackupClientQueue();

    // Create a new pool with reference to the quiz
    // being used (the question number is always fixed)
    var clientAnswerPool = new ClientAnswerPool(quizBeingUsed);

    // Object(ChatGroupId{string} => ChatGroup)
    var chatGroups = {};




    // ===== Utils =====

    /**
     * @param {string} sessionId
     */
    function getClientFromSessionId(sessionId) {
        return allSessions.getSessionById(sessionId).client;
    }

    /**
     * @param {Client} client
     */
    function removeClientFromEverything(client) {
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



    // ===== Chat group =====

    /**
     * @return {ChatGroup | undefined}
     */
    function formChatGroup() {
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
        function run() {
            clearTimeout(timeoutHandle);

            var newChatGroup = formChatGroup();

            if (newChatGroup) {
                setImmediate(run);   // Process next group at next available timeslot
            } else {
                timeoutHandle = setTimeout(run, timeBetweenChecks);
            }
        }

        return {
            run: run
        };
    })();

    chatGroupFormationLoop.run();

    /**
     * data = {
     *      sessionId {string}
     * }
     * 
     * @param {any} data
     */
    function handleChatGroupJoinRequest(data) {
        var client = getClientFromSessionId(data.sessionId);
        clientAnswerPool.addClient(client);

        broadcastPoolCountToBackupQueue();

        chatGroupFormationLoop.run();
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
        // Process LTI data
        var ltiObject;

        try {
            ltiObject = ltiProcessor.verifyAndCreateLTIObj(data);
        } catch (e) {
            socket.emit('loginFailure', e.message);
            return;
        }

        var user_id = ltiObject.data.user_id;

        if (!user_id) {
            socket.emit('loginFailure', 'No user ID received.');
            return;
        }

        if (allSessions.hasSessionWithUsername(user_id)) {
            socket.emit('loginFailure', 'The username is being used.');
            return;
        }

        // TODO: Need to contact database to confirm user is recognised?
        // TODO: Do we need to do this? Can't we just assume that people coming through LTI with verified messages are valid users?

        var client = new Client();
        client.username = user_id;
        client.setSocket(socket);

        var session = new Session(client);

        allSessions.addSession(session);


        // Determine if person has elevated permissions
        var hasElevatedPermissions = false;
        var roles = ltiObject.data.roles.toLowerCase().split(",");

        if (roles.indexOf("instructor") > -1 ||
            roles.indexOf("mentor") > -1 ||
            roles.indexOf("teachingassistant") > -1 ||
            roles.indexOf("administrator") > -1) {
            hasElevatedPermissions = true;
        }


        function notifyClientOfLogin() {
            // Complete login by notifying client
            socket.emit('loginSuccess', {
                sessionId: session.id,
                username: user_id,
                hasElevatedPermissions: hasElevatedPermissions,
                quiz: quizBeingUsed,
            });
        }


        if (hasElevatedPermissions) {
            // Sign in and notify immediately - no need to write log in to DB
            session.setElevatedPermissions(true);
            notifyClientOfLogin();
            return;
        }


        // If not elevated permissions, then we assume to be student who needs to be tracked

        // Documents to be stored into DB
        var userLoginEntry = {
            username: client.username,
            password: "",
            questionGroup: conf.activeQuestionGroup
            // browserInformation: browserInformation
        };

        var userQuizEntry = {
            username: client.username,
            questionGroup: conf.activeQuestionGroup,
            questionNumber: conf.fixedQuestionNumber,
            probingQuestionAnswer: -1,
            probingQuestionAnswerTime: "",
            probJustification: "",
            evaluationAnswer: -1,
            evaluationAnswerTime: "",
            evalJustification: "",
            socketID: socket.id,
            firstChoices: [-1],
            firstChoiceTimestamps: [""],
            finalChoices: [-1],
            finalChoiceTimestamps: [""],
            studentGeneratedQuestions: [new Array()],
            studentGeneratedQuestionTimestamps: [""],
            qnaSet: [new Array()],
            qnaSetTimestamps: [""],
            quizIndex: 0
        };

        // Write to DB for sign in (creating both login and userquiz entries)
        db_wrapper.userlogin.create(userLoginEntry,
            function(err, dbResults) {
                if (typeof testHook !== 'undefined'
                    && testHook.location == 'afterLoginInsert') {
                    testHook.callback();
                }

                if (err || typeof dbResults === 'undefined') {
                    console.log("#handleLoginLti() ERROR (login error) - username: %s",
                        client.username);
                    if (err) console.log(err);
                    socket.emit('db_failure', 'handleLoginLti()');
                    return;
                }
                else {
                    console.log("#handleLoginLti() - new user's login information " +
                        "saved in database: %s", client.username);

                    db_wrapper.userquiz.create(userQuizEntry,
                        function(err, dbResults) {
                            if (typeof testHook !== 'undefined'
                                && testHook.location == "afterUserQuizCollectionInsert") {
                                testHook.callback();
                            }

                            if (err || typeof dbResults === 'undefined') {
                                console.log("#handleLoginLti() " +
                                    "ERROR (login error)" +
                                    "- username: %s", client.username);
                                if (err) console.log(err);
                                socket.emit('db_failure', 'handleLoginLti()');
                                return;
                            }
                            else {
                                console.log("#handleLoginLti() - new user's quiz " +
                                    "information saved in database: %s",
                                    client.username);
                                console.log(new Date().toISOString(), client.username, dbResults);

                                notifyClientOfLogin();
                            }
                        }); // end db[user_quiz_collection].insert()
                }
            }); // end db[user_login].insert()
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

    function broadcastPoolCountToBackupQueue() {
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

        if (backupClientQueue.clientOutTray && backupClientQueue.clientOutTray.client === client) {
            backupClientQueue.moveOutTrayClientToClientPool();
            chatGroupFormationLoop.run();
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
        socket.on('loadTestReq', loadTest);
        socket.on('saveLoadTestResults', saveLoadTestResults);

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

        function loadTest(data) {  //  SPECIAL EVENT HANDLER FOR LOAD TEST
            db_wrapper.question.read({ questionGroup: conf.activeQuestionGroup },
                function(err, dbResults) {
                    var qNum = randomInteger(0, dbResults.length);
                    var resp = dbResults[qNum];
                    // console.log('#sending a load test response (%d).', qNum);
                    socket.emit('loadTestResp', resp);
                });
        }

        function saveLoadTestResults(data) {  //  data {results, options}
            var outputFilename = 'load_test_results_' + (new Date()).getTime() + '.json';

            fs.writeFile(outputFilename, JSON.stringify(data.results, null, 2), function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("The results has been saved to " + outputFilename);
                }
            });
        }

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

}