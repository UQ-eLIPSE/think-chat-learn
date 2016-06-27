var app = global.app;
var conf = global.conf;
var io = global.io;

var db_wrapper = require('./database.js');

var Client = require('../models/client');

var DiscussionRoom = require('../models/discussionRoom');
var QuizRoom = require('../models/quizRoom');

var ClientAnswerPool = require("../models/ClientAnswerPool");
var ChatGroup = require("../models/ChatGroup");

var Session = require("../models/Session");
var SessionManager = require("../models/SessionManager");

var util = require('../helpers/util');
var randomInteger = util.randomInteger;

// it's decided when the server loads quiz data from database
var NUM_QUESTIONS_PER_SESSION;

//  collection (in mongoDB) = table (in sql DB)
// var COLLECTION_PREFIX = conf.collectionPrefix;

var NUM_CASES = 1;
for (var indepVar in conf.expConditions) {
    NUM_CASES *= conf.expConditions[indepVar].length;
}

//TODO: This should be in its own module (question module?)

var quizSet;

console.log("Active question group: " + conf.activeQuestionGroup);

db_wrapper.question.read({ questionGroup: conf.activeQuestionGroup },
    function(err, dbResults) {
        //  SELECT * FROM QUESTION_TABLE WHERE questionGroup==conf.activeQuestionGroup;
        //  db["collection_name"].find(...

        //  initializes the right number (for this question set) of empty waitlists
        //  for users
        quizSet = new Array();
        for (var i = 0; i < dbResults.length; i++) {
            quizSet[i] = null;
        }
        for (var i = 0; i < dbResults.length; i++) {
            quizSet[dbResults[i].questionNumber] = dbResults[i];
        }

        //  accessing a user in a waitlist
        // quizWaitlists[conditionAssigned]
        // discussionWaitlists[conditionAssigned]
        NUM_QUESTIONS_PER_SESSION = dbResults.length;
        // for (var i = 0; i < quizSet.length; i++) { quizWaitlists[i] = new Array(); }
        // for (var i = 0; i < quizSet.length; i++) { discussionWaitlists[i] = new Array(); }
        //  initializes the right number (for questions) of empty
        //  waitlists for users
        console.log("#MOOCchat server has started\n" +
            "\tport: %d\n" +
            "\tgroup size: %d\n" +
            "\ttotal number of questions in DB: %d\n" +
            "\tactive question group: %d\n",
            conf.portNum,
            conf.groupSize,
            NUM_QUESTIONS_PER_SESSION,
            conf.activeQuestionGroup);

        // Run initialisation
        afterDbLoad();
    });

/**
 * TODO: Wrapping everything in a "after DB load" function
 * so that we're sure some variables are initialised properly when we use them
 */
function afterDbLoad() {
    // We only use one quiz ("question") at any one time
    var quizBeingUsed = quizSet[conf.fixedQuestionNumber];

    var allSessions = new SessionManager();

    // Create a new pool with reference to the quiz
    // being used (the question number is always fixed)
    var clientAnswerPool = new ClientAnswerPool(quizBeingUsed);

    // Object(ChatGroupId{string} => ChatGroup)
    var chatGroups = {};

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
        var user_id = data.user_id;

        if (!user_id) {
            socket.emit('loginFailure', 'No user ID received.');
            return;
        }

        if (allSessions.hasSessionWithUsername(user_id)) {
            socket.emit('loginFailure', 'The username is being used.');
            return;
        }

        // Verify timestamp (within 5 minutes?)
        var timestamp = data.oauth_timestamp;

        if (!timestamp) {
            // TODO: No timestamp!!!
            // return;
        }

        var timestampDifference = Math.abs(timestamp - (Date.now() / 1000));

        // TODO: 5 minutes max timestamp difference
        // if (timestampDifference > (5 * 60)) {
        //     // TODO: Message too old
        //     return;
        // }

        // TODO: Verify signature on whole message

        // TODO: Need to contact database to confirm user is recognised?
        // TODO: Do we need to do this? Can't we just assume that people coming through LTI with verified messages are valid users?

        var client = new Client();
        client.username = user_id;
        client.setSocket(socket);

        var session = new Session(client);

        allSessions.addSession(session);


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

                                // Complete login by notifying client
                                socket.emit('loginSuccess', {
                                    sessionId: session.id,
                                    username: user_id,
                                    quiz: quizBeingUsed
                                });
                            }
                        }); // end db[user_quiz_collection].insert()
                }
            }); // end db[user_login].insert()
    }




    function formChatGroup() {
        var newChatGroup = clientAnswerPool.tryMakeChatGroup();

        // Store reference to chat group if formed
        if (newChatGroup) {
            chatGroups[newChatGroup.id] = newChatGroup;
            return newChatGroup;
        }
    }

    // Recurring task
    // TODO: Have a library/package handle this task in a different thread?    
    var chatGroupFormationLoop = (function() {
        var timeBetweenChecks = 1000;  // TODO: 1 second for now
        var timeoutHandle;

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
            /**
             * Runs another round of the loop, or starts the loop if not already active.
             */
            run: run
        };
    })();

    chatGroupFormationLoop.run();


    /**
     * @param {string} username
     */
    function getClientFromUsername(username) {
        // return activeClients[username];
    }

    /**
     * data = {
     *      sessionId {string}
     * }
     * 
     * @param {any} data
     */
    function handleChatGroupJoinRequest(data) {
        var client = allSessions.getSessionById(data.sessionId).client;
        clientAnswerPool.addClient(client);

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
        var client = allSessions.getSessionById(data.sessionId).client;
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
        var client = allSessions.getSessionById(data.sessionId).client;
        var chatGroup = chatGroups[data.groupId];
        chatGroup.broadcastMessage(client, data.message);
    }

    /**
     * data = {
     *      sessionId {string}
     *      questionId {number|string?}     // Not used, hard coded question number presently
     *      answer {number|string?}
     *      justification {string}
     * }
     */
    function handleAnswerSubmissionInitial(data) {
        var client = allSessions.getSessionById(data.sessionId).client;
        var username = client.username;
        var answer = data.answer;
        var justification = data.justification;

        var socket = client.getSocket();

        // TODO: For some reason the last known answer is stored with the client...
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

        /* Chat group discussion */
        socket.on("chatGroupJoinRequest", handleChatGroupJoinRequest);
        socket.on("chatGroupMessage", handleChatGroupMessage);
        socket.on("chatGroupQuitStatusChange", handleChatGroupQuitStatusChange);

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

        function saveProbingQuestionAnswerHelper(data, finalAnswer, testHooks) { //  data : {username, screenName, , quizRoomID, questionNumber, answer, justification}
            try {
                if (!checkArgs("saveProbingQuestionAnswer", data,
                    [
                        //  "username", 
                        "screenName", "questionNumber", "answer", "justification"])) return;
                // var username = data.username;
                // var screenName = data.screenName;
                var client = allSessions.getSessionById(data.sessionId).client;
                var username = client.username;
                if (!client) return;
                var questionNumber = client.questionNumber;
                var answer = data.answer;
                var probJustification = data.justification;
                var quizRoomID = data.quizRoomID;
                // var quizRoom = activeQuizRooms[quizRoomID];

                client.probingQuestionAnswer = answer;
                client.probingQuestionAnswerTime = new Date().toISOString();

                // SAVE STUDENT PROBING QUESTION ANSWER AND TIMESTAMPS
                if (finalAnswer) {
                    // TODO FIXME: Code duplication with else branch

                    // moocchat-30
                    var update_criteria = {
                        socketID: client.getSocket().id,
                        username: client.username,
                        questionGroup: conf.activeQuestionGroup
                    };
                    var update_data = {
                        $set: {
                            probingQuestionFinalAnswer: client.probingQuestionAnswer,
                            probingQuestionFinalAnswerTime: client.probingQuestionAnswerTime,
                            probFinalJustification: probJustification
                        }
                    };
                    db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
                        console.log(new Date().toISOString(), username, update_criteria, update_data);


                        /*
                            db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.getSocket().id,
                                                                          username:username,
                                                                          questionGroup:conf.activeQuestionGroup,
                                                                          questionNumber:questionNumber},
                                                                         {$set: {probingQuestionFinalAnswer:client.probingQuestionAnswer,
                                                                                 probingQuestionFinalAnswerTime:client.probingQuestionAnswerTime,
                                                                                 probFinalJustification:probJustification}},
                                                                         function(err, dbResults) {
                        */
                        if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
                            testHooks.callback();
                        }
                        if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                            console.log("#saveProbingQuestionFinalAnswer() ERROR - " +
                                "username: %s", username);
                            if (err) console.log(err);
                            socket.emit('db_failure', 'saveProbingQuestionFinalAnswer()');
                        }
                        else {
                            console.log("#saveProbingQuestionFinalAnswer() - " +
                                "probing question answer and timestamps " +
                                "saved in database");
                            console.log(new Date().toISOString(), username, dbResults);
                        }
                    });
                } else {

                    // moocchat-30
                    var update_criteria = {
                        socketID: client.getSocket().id,
                        username: client.username,
                        questionGroup: conf.activeQuestionGroup
                    };
                    var update_data = {
                        $set: {
                            probingQuestionAnswer: client.probingQuestionAnswer,
                            probingQuestionAnswerTime: client.probingQuestionAnswerTime,
                            probJustification: probJustification
                        }
                    };
                    db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {

                        console.log(new Date().toISOString(), username, update_criteria, update_data);


                        /*
                           db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.getSocket().id,
                                                                         username:username,
                                                                         questionGroup:conf.activeQuestionGroup,
                                                                         questionNumber:questionNumber},
                                                                        {$set: {probingQuestionAnswer:client.probingQuestionAnswer,
                                                                                probingQuestionAnswerTime:client.probingQuestionAnswerTime,
                                                                                probJustification:probJustification}},
                                                                        function(err, dbResults) {
                       */
                        if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
                            testHooks.callback();
                        }
                        if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                            console.log("#saveProbingQuestionAnswer() ERROR - " +
                                "username: %s", username);
                            if (err) console.log(err);
                            socket.emit('db_failure', 'saveProbingQuestionAnswer()');
                        }
                        else {
                            console.log("#saveProbingQuestionAnswer() - " +
                                "probing question answer and timestamps " +
                                "saved in database");
                            console.log(new Date().toISOString(), username, dbResults);
                        }
                    });
                }

                // alreadyPushedAnswer = false;
                // for(var ans7 in quizRoom.probAns) {
                //   if (ans7['username'] == username) {
                //     alreadyPushedAnswer = true;
                //   }
                // }
                // if (!alreadyPushedAnswer) {
                //   quizRoom.probAns.push({username:username, screenName:screenName, answer:answer, justification:probJustification});
                //   if(quizRoom.probAns.length==quizRoom.members.length) {
                //     io.sockets.in(quizRoomID).emit('probAnswers', quizRoom.probAns);
                //   }
                // }
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
            //db[collections[QUESTION_COLLECTION]].find({questionGroup:conf.activeQuestionGroup},
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

            // TODO: Clean up groups/remove client from everything

            allSessions.removeSession(session);
        }

        //This records User's flow during the session
        function user_flow(data) {
            var username = data.username;
            // var search_criteria = { username: data.username };
            //db[collections[USER_FLOW_COLLECTION]].find({'username':data.username},function(err, dbResults) {
            db_wrapper.userflow.read({ 'username': data.username }, function(err, dbResults) {
                //console.log(dbResults);
                if (err || typeof dbResults === 'undefined' || dbResults.length == 0) {
                    console.log("#UserFlow Table ERROR doesnt exist - " +
                        "username: %s", username);
                    if (err) console.log(err);
                }
                if (!err && dbResults == 0) {

                    //db[collections[USER_FLOW_COLLECTION]].insert( {username:data.username, events:[{timestamp:data.timestamp, page:data.page, event:data.event, data:data.data}] } );
                    db_wrapper.userflow.create({ username: data.username, events: [{ timestamp: data.timestamp, page: data.page, event: data.event, data: data.data }] }, function(err, res) {

                    });
                }

                else {
                    //db[collections[USER_FLOW_COLLECTION]].update(
                    db_wrapper.userflow.update(
                        { username: data.username },
                        {
                            $addToSet: {
                                events: {
                                    $each: [{ timestamp: data.timestamp, event: data.event, page: data.page, data: data.data }]
                                }
                            }
                        }
                    )

                }

            });


        }

    });

}