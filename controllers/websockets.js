var Client = require('../models/client');
var DiscussionRoom = require('../models/discussionRoom');
var QuizRoom = require('../models/quizRoom');

var util = require('../helpers/util');
// TODO: This can be done better
var objectLength = util.objectLength;
var randomInteger = util.randomInteger;
var contains = util.contains;

var casePointer = 0;

var app = global.app;
var conf = global.conf;
var db_wrapper = require('./database.js');

var ClientAnswerPool = require("../models/ClientAnswerPool");
var ChatGroup = require("../models/ChatGroup");
var BackupClientQueue = require("../models/BackupClientQueue");


var hitToQuestionMap = new Object();
var lastQuestionNumberListIndex = -1;

/**
 * Returns the fixed question number that is set in /config/conf.json.
 * This question number points to "questionNumber" set in each record of the database table.
 * 
 * @return {number} Question number
 */
function getQuestionNumber() {
    return conf.fixedQuestionNumber;   
}


// TODO: I feel this should be somewhere else
var activeClients = new Object(); //  users online
var activeQuizRooms = new Object();
var activeDiscussionRooms = new Object();

var quizWaitlists = new Array();
var discussionWaitlists = new Array();



//

// TODO: Get rid of all these comments
//
// it's decided when the server loads quiz data from database
var NUM_QUESTIONS_PER_SESSION;
//  collection (in mongoDB) = table (in sql DB)
var COLLECTION_PREFIX = conf.collectionPrefix;
var NUM_CASES = 1;
for(var indepVar in conf.expConditions) {
  NUM_CASES *= conf.expConditions[indepVar].length;
}

//  END LOADING SERVER CONFIGURATION

//  START CONSTANTS
var QUIZ_PREFIX = "quiz_";
var DISCUSSION_PREFIX = "discussion_";
var SCREEN_NAME_PREFIX = "Student ";

var CHAR_CODE_A = 65;
var ADMIN_USERNAME = "admin";
var ADMIN_PASSWORD = "0000";
var CONTROL_MESSAGES = ["#theoryofrelativity",
                        "#theshowmustgoon",
                        "#timeflies",
                        "#testexception"];
var POST_SURVEY = require('../config/post_survey.json');

//  START CLIENT STATE CONSTANTS

var CLIENT = {
  IDLE: 100,
  QUIZ_WAITLIST: 101,
  QUIZROOM: 102
};

var STAGE = {
  READ: 0,
  DISCUSSION: 1,
  PROBING_QUESTION: 2,
  EXPLANATION: 3,
  EVALUATION: 4
};

var CONSENT_NO_SELECTION = 0;

var HASH_SECRET_KEY = 'jEQtYK8t';


var server = global.server;
var io = global.io;


//TODO: This should be in its own module (question module?)

var quizSet;

console.log("Active question group: " + conf.activeQuestionGroup);

// Old connection
//db[collections[QUESTION_COLLECTION]].find({questionGroup:conf.activeQuestionGroup},

db_wrapper.question.read({questionGroup: conf.activeQuestionGroup},
                                          function(err, dbResults) {
  //  SELECT * FROM QUESTION_TABLE WHERE questionGroup==conf.activeQuestionGroup;
  //  db["collection_name"].find(...

  //  initializes the right number (for this question set) of empty waitlists
  //  for users
  quizSet = new Array();
  for(var i=0;i<dbResults.length;i++) {
    quizSet[i] = null;
  }
  for(var i=0;i<dbResults.length;i++) {
    quizSet[dbResults[i].questionNumber] = dbResults[i];
  }

  //  accessing a user in a waitlist
  // quizWaitlists[conditionAssigned]
  // discussionWaitlists[conditionAssigned]
  NUM_QUESTIONS_PER_SESSION = dbResults.length;
  for(var i=0;i<quizSet.length;i++) { quizWaitlists[i] = new Array(); }
  for(var i=0;i<quizSet.length;i++) { discussionWaitlists[i] = new Array(); }
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
    // Create a new pool with reference to the quiz
    // being used (the question number is always fixed)
    var clientAnswerPool = new ClientAnswerPool(quizSet[getQuestionNumber()]);
    
    // Queue for instructors/tutors on standby
    var backupClientQueue = new BackupClientQueue();

    // Object(ChatGroupId{string} => ChatGroup)
    var chatGroups = {};
    


    // ===== Utils =====

    /**
     * @param {string} username
     */
    function getClientFromUsername(username) {
        return activeClients[username];
    }
    
    /**
     * @param {Socket} socket
     */
    function getClientFromSocket(socket) {
        var activeUsernames = Object.keys(activeClients);

        for (var i = 0; i < activeUsernames.length; ++i) {
            var client = getClientFromUsername(activeUsernames[i]);
            if (client.getSocket() === socket) {
                return client;
            }
        }
    }

    /**
     * @param {string} username
     * 
     * @return {Client}
     */
    function createClient(username) {
        // Only setting the username for new clients
        // Ignored parameters are intentional, as well as the use of `void 0` to
        // set the first parameter to `undefined`
        return new Client(void 0, username);
    }

    /**
     * @param {Client} client
     */
    function removeClientFromEverything(client) {
        backupClientQueue.removeClient(client);
        clientAnswerPool.removeClient(client);

        var chatGroupIds = Object.keys(chatGroups);
        for (var i = 0; i < chatGroupIds.length; ++i) {
            var chatGroup = chatGroups[chatGroupIds[i]];
            if (chatGroup.getClientIndex(client) > -1) {
                chatGroup.removeClient(client);
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
        var timeBetweenChecks = 1000;  // TODO: 1 second for now
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
     *      username {string}
     * }
     * 
     * @param {any} data
     */
    function handleChatGroupJoinRequest(data) {
        var client = getClientFromUsername(data.username);
        clientAnswerPool.addClient(client);

        broadcastPoolCountToBackupQueue();

        chatGroupFormationLoop.run();
    }
    
    /**
     * data = {
     *      groupId {string}
     *      username {string}
     *      quitStatus {boolean}
     * }
     * 
     * @param {any} data
     */
    function handleChatGroupQuitStatusChange(data) {
        var chatGroup = chatGroups[data.groupId];
        var client = getClientFromUsername(data.username);

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
     *      username {string}
     *      message {string}
     * }
     * 
     * @param {any} data
     */
    function handleChatGroupMessage(data) {
        var chatGroup = chatGroups[data.groupId];
        var client = getClientFromUsername(data.username);
        chatGroup.broadcastMessage(client, data.message);
    }



    // ===== Student client pool =====

    function broadcastPoolCountToBackupQueue() {
        backupClientQueue.broadcastEvent("clientPoolCountUpdate", {
            numberOfClients: clientAnswerPool.totalPoolSize()
        });
    }



    // ===== Question + answer =====

    /**
     * data = {
     *      username {string}
     * }
     */
    function handleQuestionContentRequest(data) {
        var client = getClientFromUsername(data.username);

        client.getSocket().emit("questionContent", {
            quiz: quizSet[getQuestionNumber()]
        });
    }

    /**
     * data = {
     *      username {string}
     *      questionId {number|string?}     // Not used, hard coded question number presently
     *      answer {number|string?}
     *      justification {string}
     * }
     */
    function handleAnswerSubmissionInitial(data) {
        var username = data.username;
        var client = getClientFromUsername(username);
        var answer = data.answer;
        var justification = data.justification;
        
        var socket = client.getSocket();
        
        // TODO: For some reason the last known answer is stored with the client...
        // Carried over from saveProbingQuestionAnswerHelper()
        client.probingQuestionAnswer = answer;
        client.probingQuestionAnswerTime = new Date().toISOString();
        client.probJustification = justification;
        
        var update_criteria = {
            socketID: client.socketID,
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
     *      username {string}
     * }
     * 
     * @param {Object} data
     * @param {Socket} socket
     */
    function handleBackupClientLogin(data, socket) {
        // TODO: Validate user
        var username = data.username;

        var loginState = {
            success: true,
            message: ""
        };

        if (backupClientQueue.isUsernameLoggedIn(username)) {
            loginState.success = false;
            loginState.message = "Already logged in";
        }

        if (!loginState.success) {
            socket.emit("backupClientLoginState", loginState);
            return;
        }

        var newClient = createClient(data.username);
        newClient.setSocket(socket);
        activeClients[newClient.username] = newClient;

        socket.emit("backupClientLoginState", loginState);
    }

    /**
     * data = {
     *      username {string}
     * }
     */
    function handleBackupClientLogout(data) {
        var client = getClientFromUsername(data.username);
        removeClientFromEverything(client);
    }

    /**
     * data = {
     *      username {string}
     *      answer {number}
     *      justification {string}
     * }
     */
    function handleBackupClientEnterQueue(data) {
        var client = getClientFromUsername(data.username);

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
     *      username {string}
     * }
     */
    function handleBackupClientStatusRequest(data) {
        if (!backupClientQueue.isUsernameLoggedIn(data.username)) {
            return;
        }

        broadcastBackupClientQueueStatus();
        broadcastPoolCountToBackupQueue();
    }

    /**
     * data = {
     *      username {string}
     * }
     */
    function handleBackupClientTransferConfirm(data) {
        var client = getClientFromUsername(data.username);

        if (backupClientQueue.clientOutTray &&
            backupClientQueue.clientOutTray.client === client) {
            backupClientQueue.moveOutTrayClientToClientPool();
            chatGroupFormationLoop.run();
        }
    }

    function broadcastBackupClientQueueStatus() {
        backupClientQueue.broadcastUpdate();
    }



io.sockets.on('connection', function(socket) {
  //  socket is for ONE client
  //  EVENT-DRIVEN message exchange between a client and the server
  //  to trigger event <-> to handle event
  //  socket.emit(event_name) <-> socket.on(event_name)

  // For unit test framework to know when to begin
  socket.emit('connected');

  //  START register socket event handlers
  socket.on('login_req', login); // under test
  socket.on("user_flow", user_flow);
  socket.on('savePromptResp', savePromptResp);
  socket.on('quizWaitlistReq', quizWaitlist);
  socket.on('quizWaitlistForceProceed', quizWaitlistForceProceed);
  socket.on('updateQuizWaitlistReq', updateQuizWaitlist);
  socket.on('joinQuizRoomReq', joinQuizRoom); // under test
  socket.on('quizReq', sendQuiz);
  socket.on("studentGeneratedQuestionsSubmission",
            saveStudentGeneratedQuestions);
  socket.on('finishedReading', readyForDiscussion);
  socket.on("qnaSetSubmission", saveQNASet);
  socket.on("userListReq", sendUserList);
  socket.on("chatMessage", broadcastChatMessage);
  socket.on('discussionQuitReq', broadcastDiscussionQuit); // under test
  socket.on("probingQuestionAnswerSubmission", saveProbingQuestionAnswer);
  socket.on("probingQuestionFinalAnswerSubmission", saveProbingQuestionFinalAnswer);
  socket.on('submitEvaluation', saveEvaluation);
  socket.on('submitSurvey', saveSurvey);
  socket.on('getTime', getTime);
 socket.on('setConsent', setConsent);  // under test
 socket.on('getConsent', getConsent);  // under test

  // Special event sent when socket disconnects
  socket.on('disconnect', disconnect);
  socket.on('pauseGroupTimer', pauseGroupTimer);
  socket.on('updateQNAset', updateQNAset);
  socket.on('discussionRatingSubmission', saveDiscussionRating);
  socket.on('proceedAfterMemberDropsReq', sendForceProceed);
  socket.on('readyForPostDiscussion', readyForPostDiscussion);
  socket.on('loadTestReq', loadTest);
  socket.on('saveLoadTestResults', saveLoadTestResults);


    // New socket events
    socket.on("chatGroupJoinRequest", handleChatGroupJoinRequest);
    socket.on("chatGroupMessage", handleChatGroupMessage);
    socket.on("chatGroupQuitStatusChange", handleChatGroupQuitStatusChange);
    
    socket.on("answerSubmissionInitial", handleAnswerSubmissionInitial)

    socket.on("backupClientLogin", function(data) { handleBackupClientLogin(data, socket); });
    socket.on("backupClientLogout", handleBackupClientLogout);
    socket.on("backupClientEnterQueue", handleBackupClientEnterQueue);
    socket.on("backupClientStatusRequest", handleBackupClientStatusRequest);
    socket.on("backupClientTransferConfirm", handleBackupClientTransferConfirm);

    socket.on("questionContentRequest", handleQuestionContentRequest);

  function getClient(username) {
    if (!(username in activeClients)) {
      socket.emit('missingClient', {username:username});
      return null;
    }
    return activeClients[username];
  }

  // Makes sure all names in argNames are in data
  function checkArgs(eventName, data, argNames) {
    for (var i=0; i < argNames.length; i++) {
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

  function canonicalUsername(name) {
    return name.replace(/0/g, "O").replace(/l/g, "I").replace(/1/g, "I").toLowerCase();
  }

  function usernameMatches(name1, name2) {
    return canonicalUsername(name1) == canonicalUsername(name2);
  }

  function login(data, testHook) {
	console.log(JSON.stringify(data));
    try {
      if (!checkArgs('login_req', data, ['username', 'password'])) return;
      if(data.username==ADMIN_USERNAME && data.password==ADMIN_PASSWORD) {
        socket.emit('adminModeAccepted');
        return;
      }

      //  START DB SEARCH FOR LOGIN
      userFound = false;
      //db[collections[USERNAMES_COLLECTION]].find().forEach(function(err, dbResults) {
      db_wrapper.user.read({username: data.username}, function(err, dbResults) {
        //console.log("Username collection: " + collections[USERNAMES_COLLECTION]);
        dbResults = dbResults[0];
        /* Failed DB Search */
        if(err || dbResults == null || typeof dbResults === 'undefined' || dbResults.length == 0) {
          if (!userFound) {
            console.log("#login() ERROR (login error) - username: %s",
                        data.username);
            if(err) console.log(err);
            socket.emit('loginFailure', 'Invalid username');
            console.log("loginFailure: invalid username");
          }
          return;
        }
      if (!userFound && usernameMatches(dbResults.username, data.username)) {
      userFound = true;
      console.log("#login(): found user '" + dbResults.username + "' matching login '" + data.username + "'" );

      db_wrapper.userlogin.read({username:dbResults.username, password:data.password},
                                                    function(err, dbResults2) {
          /* Failed DB Search */


          if(err || typeof dbResults2 === 'undefined') {
            console.log("#login() ERROR (login error) - username: %s",
                        data.username);
            if(err) console.log(err);
            socket.emit('loginFailure', 'Wrong username or password');
            console.log("loginFailure: wrong username or password");
          }
          // Did not err on DB search. I guess we dont care
          // what the results are?
          else {
            //  HANDLING DUPLICATE CONECTION
            var existingConnection = false;
            for(var existingUsername in activeClients) {
              if(existingUsername==dbResults.username) {
                existingConnection = true;
                break;
              }
            }
            if(existingConnection) {
              socket.emit('loginFailure', 'The username is being used.');
              console.log("loginFailure: username is being used.");
              console.log("state: " + getClient(dbResults.username).clientState);
              return;
            }
            /* But user supplied the wrong password */
            if(data.password != "ischool") {
              socket.emit('loginFailure', 'Wrong username or password');
              console.log("loginFailure: wrong username or password");
            }
            /* User supplied the correct password. */
            else {
              var username = dbResults.username;
              var password = data.password;
			  var browserInformation = data.browserInformation;

              testUsernames = ["A2X3ZSPAADO7P1", "A172XZJCUW07G6", "derrick",
                               "marti", "taek", "bjoern", "armando", "test1",
                               "test2", "test3", "test4", "test5", "test6",
                               "test7", "test8", "test9"];

			  // moocchat-30
	var search_criteria = {username:username, questionGroup:conf.activeQuestionGroup};

	db_wrapper.userquiz.read(search_criteria, function(err, dbResults) {
		console.log(new Date().toISOString(), username, search_criteria, dbResults);

		/*
              db[collections[USER_QUIZ_COLLECTION]].find({username:username,
                                                          questionGroup:conf.activeQuestionGroup},
                                                         function(err, dbResults) {
		*/
                // Disable existing user check during edX run - we want them
                // to be able to do it multiple times if they wish
                // TODO: Handle database errors and already-exists separately
                if((err || typeof dbResults === 'undefined' ||
                    (!conf.allowRepeat && dbResults.length > 0)) &&
                   !contains(testUsernames, username)) {
                  console.log("#login() new user %s already exists: %d",
                              username, dbResults.length);
                  socket.emit('loginExistingUser', {username:username});
                } else {  // username found in USER_LOGIN_COLLECTION, and
                          // username+questionGroup found in conf.activeQuestionGroup
                  console.log("#login() new user: %s", username);

                  var userLoginEntry = {username:username,
                                        password:password,
                                        questionGroup:conf.activeQuestionGroup,
										browserInformation: browserInformation
										};

                  db_wrapper.userlogin.create(userLoginEntry,
                                                                function(err, dbResults) {
                    if (typeof testHook !== 'undefined'
                      && testHook.location == 'afterLoginInsert') {
                      testHook.callback();
                    }
                    if(err || typeof dbResults === 'undefined') {
                      console.log("#login() ERROR (login error) - username: %s",
                                  username);
                      if(err) console.log(err);
                      socket.emit('db_failure', 'login()');
                    }
                    else {
                      console.log("#login() - new user's login information " +
                                  "saved in database: %s", username);
                    }
                  }); // end db[user_login].insert()


                  var firstChoices = new Array();
                  var firstChoiceTimestamps = new Array();
                  var studentGeneratedQuestions = new Array();
                  var studentGeneratedQuestionTimestamps = new Array();
                  var promptResps = new Array();
                  var promptRespsTime = new Array();
                  var evaluationAnswer = new Array();
                  var evaluationAnswerTime = new Array();
                  var probingQuestionAnswers = new Array();
                  var probingQuestionAnswerTime = new Array();
                  var qnaSet = new Array();
                  var qnaSetTimestamps = new Array();
                  var finalChoices = new Array();
                  var finalChoiceTimestamps = new Array();
                  for(var i=0;i<quizSet.length;i++) {
                    firstChoices[i] = -1;
                    firstChoiceTimestamps[i] = "";
                    studentGeneratedQuestions[i] = new Array();
                    studentGeneratedQuestionTimestamps[i] = "";
                    promptResps[i] = -1;
                    promptRespsTime[i] = -1;
                    qnaSet[i] = new Array();
                    qnaSetTimestamps[i] = "";
                    finalChoices[i] = -1;
                    finalChoiceTimestamps[i] = "";
                  }

                  //  START FROM THE FIRST QUESTION: THIS DOESN'T MEAN
                  //  QUESTION NUMBER 1 IN DATABASE!
                  var quizIndex = 0;

                  db_wrapper.question.read({questionGroup:conf.activeQuestionGroup},
                                                            function(err, dbResults) {
                    if(err ||
                       typeof dbResults === 'undefined' ||
                       dbResults.length==0) {
                      console.log("#login() ERROR (questionNumber error) " +
                                  "- username: %s", username);
                      if(err) console.log(err);
                      socket.emit('db_failure', 'login()');
                    }
                    else {
                      //  INSERT THE QUIZ ENTRY FOR THIS USER INTO
                      //  USER_QUIZ_COLLECTION

                      var questionNumber = getQuestionNumber(data.turkHitId);

                      var userQuizEntry = {username:username,
                                           questionGroup:conf.activeQuestionGroup,
                                           questionNumber:questionNumber,
                                           probingQuestionAnswer:-1,
                                           probingQuestionAnswerTime:"",
                                           probJustification:"",
                                           evaluationAnswer:-1,
                                           evaluationAnswerTime:"",
                                           evalJustification:"",
                                           socketID:socket.id,
                                           firstChoices:firstChoices,
                                           firstChoiceTimestamps:firstChoiceTimestamps,
                                           finalChoices:finalChoices,
                                           finalChoiceTimestamps:finalChoiceTimestamps,
                                           studentGeneratedQuestions:studentGeneratedQuestions,
                                           studentGeneratedQuestionTimestamps:studentGeneratedQuestionTimestamps,
                                           qnaSet:qnaSet,
                                           qnaSetTimestamps:qnaSetTimestamps,
                                           quizIndex:quizIndex
                                          };

			// [moocchat-30]
			//console.log("%s,%s, %s", new Date().toISOString(), username, userQuizEntry);

                      db_wrapper.userquiz.create(userQuizEntry,
                                                                   function(err, dbResults) {
						if (typeof testHook !== 'undefined'
                          && testHook.location == "afterUserQuizCollectionInsert") {
                          testHook.callback();
                        }
                        if(err || typeof dbResults === 'undefined') {
                          console.log("#discussionWaitlist() " +
                                      "ERROR (login error)" +
                                      "- username: %s", username);
                          if(err) console.log(err);
                          socket.emit('db_failure', 'login()');
                        }
                        else {
                          console.log("#login() - new user's quiz " +
                                      "information saved in database: %s",
                                      username);
                          console.log(new Date().toISOString(), username, dbResults);
                        }
                      }); // end db[user_quiz_collection].insert()
                      var client = new Client(socket.id,
                                              username,
                                              firstChoices,
                                              firstChoiceTimestamps,
                                              finalChoices,
                                              finalChoiceTimestamps,
                                              studentGeneratedQuestions,
                                              studentGeneratedQuestionTimestamps,
                                              promptResps,
                                              promptRespsTime,
                                              qnaSet,
                                              qnaSetTimestamps,
                                              quizIndex);
                      activeClients[username] = client;
                      
                      // Using socket referencing in newer code,
                      // rather than using socket ID and looking it up again
                      client.setSocket(socket);

                      client.questionNumber = questionNumber;
                      console.log("#login() - active clients: %d",
                                  objectLength(activeClients));

                      //  SEND LOGIN SUCCESS SIGNAL WITH QUIZ DATA
                      //console.log("QUIZ----");
                      //console.log(quizSet);
                      socket.emit('loginSuccess',
                                {username:activeClients[username].username, quiz:quizSet[questionNumber]});
                    } // end db[question_collection].find() else block
                  }); // end db[question_collection].find()
                }
              }); // end db[quiz_collection].find()
            }
          }
        }); // end db[user login].find()
        } // end if (usernameMatches(dbResults.username, data.username))
      }); // end db[username].find()
    }  // end try block
    catch(err)
    {
      handleException(err);
    }
  }

  function quizWaitlist(data) {
  try {
    if (!checkArgs('quizWaitlistReq', data, ['username'])) return;
    var username = data.username;
    var client = getClient(username);
    console.log(client);
    if (!client) return;
    var questionNumber = client.questionNumber;
    var quizCounter = client.quizCounter;
    // if(questionNumber>=quizSet.length) {
    //   var message = "You've completed all the questions. " +
    //                 "Please fill out the questionnaire.";
    //   socket.emit('completed',
    //               {message: message,
    //                postSurvey: POST_SURVEY,
    //                maxChoices: 6});
    //   return;
    // }

    if(quizCounter>=NUM_QUESTIONS_PER_SESSION) {
      var message = "You've completed this session. " +
                    "Please fill out the questionnaire.";
      socket.emit('completed',
                  {message:message, postSurvey:POST_SURVEY, maxChoices:6});
      return;
    }

    //  assign a user into one of the experimental cases
    var conditionAssigned = client.conditionAssigned;
    if(!client.grouped) { //  NEW USER
      conditionAssigned = casePointer;
      client.conditionAssigned = conditionAssigned;
    }

    if(username.indexOf('condition')==0 && username.charAt(username.length-1)!='2')
      conditionAssigned = client.conditionAssigned = parseInt(username.charAt(username.length-1));

    // console.log(">>>>>>");
    // console.log(questionNumber);
    // console.log(quizWaitlists);
    if(quizWaitlists[questionNumber].indexOf(client)<0) {
      // PUT THE CLIENT IN THE WAITLIST
      quizWaitlists[questionNumber].push(client);
      client.clientState = CLIENT.QUIZ_WAITLIST;
      console.log("#quizWaitlist() new user added - username: %s, " +
                  "questionNumber: %d, " +
                  "waiting for quiz: %d",
                  username,
                  questionNumber,
                  quizWaitlists[questionNumber].length);
    }

    if(quizWaitlists[questionNumber].length<client.groupSize) {
      //  DO NOTHING. THE CLIENT WILL JUST WAIT
    }
    else {  //  CAN MAKE A GROUP FOR QUIZ
      var questionNumber = client.questionNumber;
      createQuizGroup(username, questionNumber, conditionAssigned, client.groupSize);
    }
  }
  catch(err)
  {
    handleException(err);
  }
}

function quizWaitlistForceProceed(data) {
  try {
    if (!checkArgs('quizWaitlistForceProceed', data, ['username'])) return;
    var username = data.username;
    var client = getClient(username);
    if (!client) return;
    var conditionAssigned = client.conditionAssigned;
    console.log("#quizWaitlistForceProceed");

    var questionNumber = client.questionNumber;
    createQuizGroup(username, questionNumber, conditionAssigned, 1);
  }
  catch(err)
  {
    handleException(err);
  }
}

function randomAlphanumericString(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
}

function createQuizGroup(username, questionNumber, conditionAssigned, groupSize, testHook) {
  var quizRoomID = QUIZ_PREFIX + questionNumber + "_" +
                   username + "_" + conditionAssigned + "_" + randomAlphanumericString(64);
  var client = getClient(username);

  //  SAVE QUIZ ROOM IN DATABASE
  var quizRoomDBEntry = {quizRoomID:quizRoomID,
                         questionGroup:conf.activeQuestionGroup,
                         questionNumber:questionNumber,
                         members:[],
                         conditionAssigned:conditionAssigned
                       };
  db_wrapper.quizroom.create(quizRoomDBEntry,
                                               function(err, dbResults) {
    if (typeof testHook !== 'undefined'
      && testHook.location == 'afterInsert') {
      testHook.callback();
    }

    if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
      console.log("#createQuizGroup() ERROR - username: %s",
                  username);
      if(err) console.log(err);
      socket.emit('db_failure', 'createQuizGroup()');
    }
    else {
      console.log("#createQuizGroup() - quiz room saved in database");
    }
  });

  //  increase casePointer after forming a group: the group to be formed
  //  next time will be assigned into the next experimental condition
  do {
    casePointer = (casePointer + 1) % NUM_CASES;
  }
  while(contains(conf.casesToSkip, casePointer));

  // var groupSize = quizWaitlists[questionNumber].length;
  for(var i=0;i<groupSize;i++) {
    client = quizWaitlists[questionNumber][i];
    console.log("#quizWaitlist() grouped - quizRoomID: %s, " +
                "username: %s, " +
                "conditionAssigned: %d",
                quizRoomID,
                client.username,
                client.conditionAssigned);
    client.quizRoomID = quizRoomID;
    client.groupSize = groupSize;// quizWaitlists[questionNumber].length;
    client.grouped = true;

    // client.questionNumber = questionNumber;
/*
db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {quizRoomID:quizRoomID}},
                                                function(err, dbResults) {
*/
// moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {quizRoomID:quizRoomID}};
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {

  if (typeof testHook !== 'undefined'
        && testHook.location == 'afterUpdate') {
        testHook.callback();
      }

      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#createQuizGroup() ERROR - username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'createQuizGroup()');
      }
      else {
        console.log("#createQuizGroup() - " +
                    "question number updated in database");
    //console.log(new Date().toISOString(), username, update_criteria, update_data);
      }
    });
    io.sockets.connected[client.socketID].emit('groupedForQuiz',
                                            {username:client.username,
                                             quizRoomID:quizRoomID,
                                             questionNumber:questionNumber,
                                             conditionAssigned:conditionAssigned,
                                             conditionSet:conf.expConditions,
                                             numMembers:quizWaitlists[questionNumber].length});
  }
}

function updateQuizWaitlist(data) {
  try {
    if (!checkArgs('updateQuizWaitlistReq', data,
                   ['username', 'quizRoomID'])) return;
    var username = data.username;
    var quizRoomID = data.quizRoomID;

    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;
    var conditionAssigned = client.conditionAssigned;

    //  UPDATE WAITLIST
    for(var i=0;i<quizWaitlists[questionNumber].length;i++) {
      if(quizWaitlists[questionNumber][i].username==username) {
        quizWaitlists[questionNumber].splice(i, 1);
        console.log("#updateQuizWaitlist() - " + username + " removed - " +
                    "quizWaitlists[" + questionNumber + "].length: " +
                    quizWaitlists[questionNumber].length);
        break;
      }
    }

    client.clientState = CLIENT.IDLE;

    socket.emit('quizWaitlistUpdated', data);
  }
  catch(err)
  {
    handleException(err);
  }
}

function joinQuizRoom(data) {
  try {
    if (!checkArgs('joinQuizRoomReq', data,
                   ['username', 'quizRoomID'])) return;
    var username = data.username;
    var quizRoomID = data.quizRoomID;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;

    if(!(quizRoomID in activeQuizRooms)) {
      activeQuizRooms[quizRoomID] = new QuizRoom(quizRoomID, questionNumber);
      console.log("#joinQuizRoom() quiz room created. - " +
                  "quizRoomID: %s, questionNumber: %d",
                  quizRoomID, questionNumber);
    }

    var quizRoom = activeQuizRooms[quizRoomID];

    quizRoom.addMember(client);
    client.clientState = CLIENT.QUIZROOM;

    //  UPDATE QUIZ ROOM MEMBERS IN DATABASE
    db_wrapper.quizroom.update({quizRoomID:quizRoomID,
                                                  questionGroup:conf.activeQuestionGroup,
                                                  questionNumber:questionNumber},
                                                 {$push: {members:username}},
                                                 function(err, dbResults) {

      if(err || typeof dbResults === 'undefined') {
        console.log("#joinQuizRoom() ERROR - username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'joinQuizRoom()');
      }
      else {
        console.log("#joinQuizRoom() - quiz room members saved in database");
      }
    });
    io.sockets.connected[client.socketID].join(quizRoomID);
    console.log("#joinQuizRoom() member added - " +
                "quizRoomID: %s, username: %s, " +
                "%d members are in the quiz room",
                quizRoomID, username, quizRoom.members.length);
    socket.emit('joinedForQuiz', data);
  }
  catch(err)
  {
    handleException(err);
  }
}

function sendQuiz(data) {
  try {
    if (!checkArgs('quizReq', data, ['username', 'quizRoomID'])) return;
    var username = data.username;
    var quizRoomID = data.quizRoomID;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;

    //  TEMPLATE ALLOCATION FOR STRUCTUREDNESS_HIGH. ALLOCATION OCCURS FOR
    //  EVERY CLIENT REGARDLESS OF conditionAssigned, BUT CLIENTS IN THAT
    //  CONDITION ONLY USE THE ALLOCATED TEMPLATES
    var quizRoom = activeQuizRooms[quizRoomID];
    // var quiz = quizSet[questionNumber];

    //  ASSIGNING SPECIFIC QUESTION TEMPLATES TO THE CLIENT: NOT USED FOR NOW
    // var sliceLength = quiz.maxChoiceForStudentGenerateQuestion;
    // var memberIndex = quizRoom.members.indexOf(client);
    //  MAKE SURE quizSet HAS ENOUGH NUMBER OF TEMPLATES!
    // var templateSlice;
    // if((memberIndex+1)*sliceLength <=
    //    quizSet[questionNumber].questionTemplates.length-1) {
    //   templateSlice =
    //     quiz.questionTemplates.slice(memberIndex*sliceLength,
    //                                  (memberIndex+1)*sliceLength);
    // }
    // else {
    //   templateSlice = quiz.questionTemplates.slice(memberIndex*sliceLength);
    // }
    // quiz["templateSlice"] = templateSlice;

    socket.emit('quiz', {username:username,
                         quizRoomID:quizRoomID});
  }
  catch(err)
  {
    handleException(err);
  }
}

function saveStudentGeneratedQuestions(data, testHooks) {
  try {
    if (!checkArgs("studentGeneratedQuestionsSubmission", data,
                   ["username", "quizRoomID",
                    "studentGeneratedQuestions"])) return;
    var username = data.username;
    var quizRoomID = data.quizRoomID;
    var studentGeneratedQuestions = data.studentGeneratedQuestions;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;

    client.studentGeneratedQuestions[questionNumber] =
      studentGeneratedQuestions;
    client.studentGeneratedQuestionTimestamps[questionNumber] =
      new Date().toISOString();

    //  SAVE STUDENT GENERATED QUESTIONS AND TIMESTAMPS

     // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {studentGeneratedQuestions:client.studentGeneratedQuestions,
                                                         studentGeneratedQuestionTimestamps:client.studentGeneratedQuestionTimestamps}};
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
  //console.log(new Date().toISOString(), username, update_criteria, update_data);

  /*
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {studentGeneratedQuestions:client.studentGeneratedQuestions,
                                                         studentGeneratedQuestionTimestamps:client.studentGeneratedQuestionTimestamps}},
                                                 function(err, dbResults) {
  */
      if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#saveStudentGeneratedQuestions() " +
                    "ERROR - username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'saveStudentGeneratedQuestions()');
      }
      else {
        console.log("#saveStudentGeneratedQuestions() - " +
                    "student-generated questions and timestamps " +
                    "saved in database");
          console.log(new Date().toISOString(), username, dbResults);


      }
    });

    var quizRoom = activeQuizRooms[quizRoomID];
    quizRoom.peerGeneratedQuestions.push({username:username,
                                          studentGeneratedQuestions:studentGeneratedQuestions});
    if(quizRoom.peerGeneratedQuestions.length==quizRoom.members.length) {
      broadcastPeerGeneratedQuestions(quizRoomID);
    }
  }
  catch(err)
  {
    handleException(err);
  }
}

function savePromptResp(data) { //  {username, promptResp}
  try {
    if (!checkArgs("savePromptResp", data, ["username", "promptResp"]))
      return;

    var username = data.username;
    var promptResp = data.promptResp;
    var client = getClient(username);
    if (!client) return;

    client.promptResps = promptResp;
    client.promptRespsTime = new Date().toISOString();

    console.log("#savePromptResp() - prompt response received: %s", client.promptResps);

    //  SAVE STUDENT GENERATED QUESTIONS AND TIMESTAMPS

        // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {promptResps:client.promptResps,
                                                         promptRespsTime:client.promptRespsTime}};
db[collections[USER_QUIZ_COLLECTION]].update(update_criteria, update_data, function(err, dbResults) {
  //console.log(new Date().toISOString(), username, update_criteria, update_data);

  /*
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {promptResps:client.promptResps,
                                                         promptRespsTime:client.promptRespsTime}},
                                                 function(err, dbResults) {
*/
      if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#savePromptResp() ERROR - username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'savePromptResp()');
      }
      else {
        console.log("#savePromptResp() - prompt resp saved in database");
    //console.log(new Date().toISOString(), username, dbResults);
      }
    });

    //  DO NOTHING
  }
  catch(err) {
    handleException(err);
  }
}

function saveQNASet(data, testHooks) { //  {username, quizRoomID, qnaSet}
  try {
    if (!checkArgs("saveQNASet", data,
                   ["username", "quizRoomID", "qnaSet"])) return;
    var username = data.username;
    var quizRoomID = data.quizRoomID;
    var qnaSet = data.qnaSet;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;
    var conditionAssigned = data.conditionAssigned;

    client.qnaSet[questionNumber] = qnaSet;
    client.qnaSetTimestamps[questionNumber] = new Date().toISOString();

    // SAVE STUDENT GENERATED QNA AND TIMESTAMPS
          // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {qnaSet:client.qnaSet,
                                                         qnaSetTimestamps:client.qnaSetTimestamps}};
db[collections[USER_QUIZ_COLLECTION]].update(update_criteria, update_data, function(err, dbResults) {
  //console.log(new Date().toISOString(), username, update_criteria, update_data);


  /*
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {qnaSet:client.qnaSet,
                                                         qnaSetTimestamps:client.qnaSetTimestamps}},
                                                 function(err, dbResults) {
*/
      if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#saveQNASet() ERROR (login error) - " +
                    "username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'saveQNASet()');
      }
      else {
        console.log("#saveQNASet() - " +
                    "student-generated Q&A and timestamps saved in database");

          console.log(new Date().toISOString(), username, dbResults);
      }
    });

    var quizRoom = activeQuizRooms[quizRoomID];
    // var qnaSets = quizRoom.qnaSets;
    quizRoom.qnaSets.push(qnaSet);
    if(quizRoom.qnaSets.length>=quizRoom.members.length) {
      broadcastQNASet(quizRoomID);
    }
  }
  catch(err)
  {
    handleException(err);
  }
}

function broadcastQNASet(quizRoomID) {
  try {
    var quizRoom = activeQuizRooms[quizRoomID];
    var qnaSets = quizRoom.qnaSets;
    io.sockets.in(quizRoomID).emit("shareQNAs", qnaSets);
  }
  catch(err)
  {
    handleException(err);
  }
}

function readyForDiscussion(data) { //  data : {username, quizRoomID, promptResp}
  var quizRoomID = data.quizRoomID;
  var username = data.username;
  var promptResp = data.promptResp;
  var client = getClient(username);
  if (!client) return;
  var quizRoom = activeQuizRooms[quizRoomID];

  quizRoom.readyNum++;
  quizRoom.promptResps.push({username:username, promptResp:promptResp});

  if(quizRoom.readyNum==quizRoom.members.length) {
    io.sockets.in(quizRoomID).emit('promptResps', quizRoom.promptResps);
    // quizRoom.readyNum = 0;
  }
}

function sendUserList(data) { //  {username, quizRoomID}
  try {
    var quizRoomID = data.quizRoomID;
    var username = data.username;
    var quizRoom = activeQuizRooms[quizRoomID];
    var userList = [];

    for(var i=0;i<quizRoom.members.length;i++) {
      var member = quizRoom.members[i];
      var name = member.username;
      var screenName = SCREEN_NAME_PREFIX + (i+1);
      userList.push({username:name, screenName:screenName});
    }
    socket.emit("userList", userList);
  }
  catch(err)
  {
    handleException(err);
  }
}

function createDiscussionGroup(username,
                               quizIndex,
                               questionNumber,
                               conditionAssigned,
                               testHooks) {
  var discussionRoomID = DISCUSSION_PREFIX + quizIndex + "_" +
                         questionNumber + "_" + username + "_" +
                         conditionAssigned;
  console.log("#createDiscussionGroup: %s", discussionRoomID);

  // SAVE DISCUSSION ROOM IN DATABASE
  var discussionRoomDBEntry = {discussionRoomID: discussionRoomID,
                               questionGroup: conf.activeQuestionGroup,
                               quizIndex: quizIndex,
                               questionNumber: questionNumber,
                               conditionAssigned: conditionAssigned,
                               members: [],
                               chatLog: {'assumption':[], 'probing':[]} };
  db[collections[DISCUSSION_ROOM_COLLECTION]].insert(discussionRoomDBEntry,
                                                     function(err, dbResults) {
    if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterInsert')) {
      testHooks.callback();
    }
    if(err || typeof dbResults === 'undefined') {
      console.log("#discussionWaitlist() ERROR (login error) - " +
                  "username: %s", username);
      if(err) console.log(err);
      socket.emit('db_failure', 'discussionWaitlist()');
    }
    else {
      console.log("#discussionWaitlist() - " +
                  "discussion room saved in database");
    }
  });
  for(var i=0;
      i < discussionWaitlists[conditionAssigned][quizIndex].length;
      i++) {
    console.log("#discussionWaitlist() grouped - discussionRoomID: %s, " +
                "username: %s, " +
                "conditionAssigned: %d",
                discussionRoomID,
                discussionWaitlists[conditionAssigned][quizIndex][i].username,
                discussionWaitlists[conditionAssigned][quizIndex][i].conditionAssigned);
    discussionWaitlists[conditionAssigned][quizIndex][i].discussionRoomID =
      discussionRoomID;
    discussionWaitlists[conditionAssigned][quizIndex][i].groupSize =
      discussionWaitlists[conditionAssigned][quizIndex].length;
    console.log("user %s in group %s for question %d in condition %d",
                username, discussionRoomID, questionNumber, conditionAssigned);
    var socketID =
      discussionWaitlists[conditionAssigned][quizIndex][i].socketID;
    io.sockets.connected[client.socketID].emit('groupedForDiscussion',
                                     {username: discussionWaitlists[conditionAssigned][quizIndex][i].username,
                                      discussionRoomID: discussionRoomID,
                                      conditionAssigned: conditionAssigned});
  }
}

function broadcastPeerGeneratedQuestions(quizRoomID) {
  try {
    var quizRoom = activeQuizRooms[quizRoomID];
    var peerGeneratedQuestions = quizRoom.peerGeneratedQuestions;

    //  TODO: SAVE QUESTIONS IN DATABASE

    io.sockets.in(quizRoomID).emit('shareQuestions', peerGeneratedQuestions);
  }
  catch(err)
  {
    handleException(err);
  }
}

function broadcastChatMessage(data) {
  try {
    if (!checkArgs("chatMessage", data,
                   ['username', 'quizRoomID',
                    'screenName', 'message'])) return;
    var quizRoomID = data.quizRoomID;

    if (!(quizRoomID in activeQuizRooms)) {
      console.log("#broadcastChatMessage() called with nonexistent " +
                  "room ID %s", quizRoomID);
      return;
    }

    var quizRoom = activeQuizRooms[quizRoomID];

    quizRoom.appendChatLog(data);
    io.sockets.in(quizRoomID).emit("chatMessage", data);
  }
  catch(err)
  {
    handleException(err);
  }
}

function broadcastDiscussionQuit(data) {
  //  data = {screenName:screenName, quizRoomID:quizRoomID, wantToQuit:wantToQuit}
  var screenName = data.screenName;
  var quizRoomID = data.quizRoomID;
  var wantToQuit = data.wantToQuit;
  var quizRoom = activeQuizRooms[quizRoomID];
  if (!quizRoom) {
    // FIXME: THIS IS A HACK - quizRoom null here was causing server crashes
    console.log("#broadcastDiscussionQuit(): quizRoom is null (screenName %s, quizRoomID %s)", screenName, quizRoomID);
    return;
  }
  if(wantToQuit) quizRoom.quitReq++;
  else quizRoom.quitReq--;

  if(quizRoom.quitReq==quizRoom.members.length) {
    //  UPDATE CHAT LOG OF THE QUIZ ROOM IN DATABASE WHEN DISCUSSION FINISHES
    db_wrapper.quizroom.update({quizRoomID:quizRoomID,
                                                  questionGroup:conf.activeQuestionGroup,
                                                  questionNumber:quizRoom.questionNumber},
                                                  {$set: {chatLog:quizRoom.chatLog}},
                                                 function(err, dbResults) {
      if(err || typeof dbResults === 'undefined') {
        console.log("#broadcastDiscussionQuit() ERROR - username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'broadcastDiscussionQuit()');
      }
      else {
        console.log("#broadcastDiscussionQuit() - quiz room chat log saved in database");
      }
    });
    if (quizRoom.currentChatLog == 'assumption') {
      console.log('Switching to probing chat log');
      quizRoom.currentChatLog = 'probing';
    }
  }
  io.sockets.in(quizRoomID).emit("requestToQuitUpdated", {screenName:screenName,
                                                          wantToQuit:wantToQuit,
                                                          numMembers:quizRoom.members.length,
                                                          quitReq:quizRoom.quitReq});
  if (quizRoom.quitReq >= quizRoom.members.length) {
    // Quit request succeeeded, reset for next discussion
    quizRoom.quitReq = 0;
  }
}

function saveProbingQuestionAnswer(data, testHooks) {
  saveProbingQuestionAnswerHelper(data, false, testHooks);
}

function saveProbingQuestionFinalAnswer(data, testHooks) {
  saveProbingQuestionAnswerHelper(data, true, testHooks);
}

function saveProbingQuestionAnswerHelper(data, finalAnswer, testHooks) { //  data : {username, screenName, , quizRoomID, questionNumber, answer, justification}
  try {
    if (!checkArgs("saveProbingQuestionAnswer", data,
                 ["username", "screenName", "questionNumber", "answer", "justification"])) return;
    var username = data.username;
    var screenName = data.screenName;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;
    var answer = data.answer;
    var probJustification = data.justification;
    var quizRoomID = data.quizRoomID;
    var quizRoom = activeQuizRooms[quizRoomID];

    client.probingQuestionAnswer = answer;
    client.probingQuestionAnswerTime = new Date().toISOString();

    // SAVE STUDENT PROBING QUESTION ANSWER AND TIMESTAMPS
    if (finalAnswer) {
      // TODO FIXME: Code duplication with else branch

          // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {probingQuestionFinalAnswer:client.probingQuestionAnswer,
                                                           probingQuestionFinalAnswerTime:client.probingQuestionAnswerTime,
                                                           probFinalJustification:probJustification}};
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
  console.log(new Date().toISOString(), username, update_criteria, update_data);


  /*
      db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
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
        if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
          console.log("#saveProbingQuestionFinalAnswer() ERROR - " +
                      "username: %s", username);
          if(err) console.log(err);
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
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {probingQuestionAnswer:client.probingQuestionAnswer,
                                                           probingQuestionAnswerTime:client.probingQuestionAnswerTime,
                                                           probJustification:probJustification}};
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {

  console.log(new Date().toISOString(), username, update_criteria, update_data);


   /*
      db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
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
        if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
          console.log("#saveProbingQuestionAnswer() ERROR - " +
                      "username: %s", username);
          if(err) console.log(err);
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
  catch(err)
  {
    handleException(err);
  }
}

function saveEvaluation(data) { //  data : {username, questionNumber, answer, justification}
  try {
    if (!checkArgs("saveEvaluation", data,
                 ["username", "questionNumber", "answer"])) return;
    var username = data.username;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;
    var answer = data.answer;
    var evalJustification = data.justification;

    client.evaluationAnswer = answer;
    client.evaluationAnswerTime = new Date().toISOString();

    // SAVE STUDENT EVALUATION QUESTION ANSWER AND TIMESTAMPS


    // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {evaluationAnswer:client.evaluationAnswer,
                                                         evaluationAnswerTime:client.evaluationAnswerTime,
                                                         evalJustification:evalJustification}};
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
  console.log(new Date().toISOString(), username, update_criteria, update_data);
 /*
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup,
                                                  questionNumber:questionNumber},
                                                 {$set: {evaluationAnswer:client.evaluationAnswer,
                                                         evaluationAnswerTime:client.evaluationAnswerTime,
                                                         evalJustification:evalJustification}},
                                                 function(err, dbResults) {
*/
      if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#saveEvaluation() ERROR - " +
                    "username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'saveEvaluation()');
      }
      else {
        console.log("#saveEvaluation() - " +
                    "evaluation answer and timestamp " +
                    "saved in database");
      }
    });
  }
  catch(err)
  {
    handleException(err);
  }
}

function broadcastMessage(data) {
  try {
    if (!checkArgs('message', data,
                   ['username', 'discussionRoomID', 'screenName',
                    'firstChoice', 'message'])) return;
    var discussionRoomID = data.discussionRoomID;
    if (!(discussionRoomID in activeDiscussionRooms)) {
      console.log("#broadcastMessage() called with " +
                  "nonexistent room ID %s", discussionRoomID);
      return;
    }
    var discussionRoom = activeDiscussionRooms[discussionRoomID];

    var controlMessageIndex = CONTROL_MESSAGES.indexOf(data.message);

    if(controlMessageIndex<0) {
      discussionRoom.appendChatLog(data);
      io.sockets.in(discussionRoomID).emit('message', data);
    }

    //** For tests, "data" has been added to the emit arguments **//
    else {  //  CONTROL MESSAGE HANDLER
      if(controlMessageIndex==0) {
        //  STOP TIMERS - not working right now due to client changes
        io.sockets.in(discussionRoomID).emit('stopTimer', data);
      }
      else if(controlMessageIndex==1) {
        //  RESUME TIMERS
        io.sockets.in(discussionRoomID).emit('resumeTimer', data);
      }
      else if(controlMessageIndex==2) {
        //  SET TIMERS TO THREE
        io.sockets.in(discussionRoomID).emit('timerToThree', data);
      }
      else if(controlMessageIndex==3) {
        //  SIMULATE EXCEPTION
        quizWaitlists['test']['exception'] = 1;
      }
      else {
        //  TBD
      }
    }
  }
  catch(err)
  {
    handleException(err);
  }
}

function saveSurvey(data) {
  try {
    if (!checkArgs('saveSurvey', data, ['username', 'general', 'discussion'])) return;

    db[collections[POST_SURVEY_COLLECTION]].insert(data, function(err, dbResults) {
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#saveSurvey() ERROR");
        if(err) console.log(err);
        socket.emit('db_failure', 'saveSurvey()');
      }
      else {
        console.log("#saveSurvey() - survey response saved in database");
      }
    });
  }
  catch(err)
  {
    handleException(err);
  }
}

function getTime(data) {
  try {
    if (!checkArgs('getTime', data, ['username'])) return;
    console.log("Username %s started waiting for session", data.username);
    var now = new Date();
    socket.emit('getTimeComplete', now.toString());
  }
  catch(err)
  {
    handleException(err);
  }
}

function getConsent(data) {
  try {
    if (!checkArgs('getTime', data, ['username'])) return;
    db[collections[USER_CONSENT_COLLECTION]].find({username:data.username},
                                                  function(err, dbResults) {
      if(err || typeof dbResults === 'undefined') {
        console.log("#getConsent() ERROR (get consent information error) - " +
                    "username: %s", data.username);
        if(err) console.log(err);
        socket.emit('db_failure', 'setConsent()');
      } else if (dbResults.length==0) {
        console.log("Username %s not in consent database, " +
                    "returning CONSENT_NO_SELECTION",
                    data.username);
        socket.emit('getConsentComplete', CONSENT_NO_SELECTION);
      } else {
        console.log("Username %s in consent database with value %d",
                    data.username, dbResults[0].value);
  socket.emit('getConsentComplete',{username:data.username, consent_selection:dbResults[0].value});
      }
    });
  }
  catch(err)
  {
    handleException(err);
  }
}

function setConsent(data) {
  try {

    if (!checkArgs('setConsent', data, ['username', 'value'])) return;
    console.log("Username %s set consent to %d", data.username, data.value);
    db[collections[USER_CONSENT_COLLECTION]].insert(data,
                                                    function(err, dbResults) {
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#setConsent() ERROR (consent database update error) - " +
                    "username: %s, value: %d", username, value);
        if(err) console.log(err);
        socket.emit('db_failure', 'setConsent()');
      }
      else {
        console.log("#setConsent() - new value saved in database");
        //socket.emit('setConsentComplete');
    socket.emit('setConsentComplete',{username:data.username});


      }
    });
  }
  catch(err)
  {
    handleException(err);
  }
}

function pauseGroupTimer(data) {  //  data : {quizRoomID}
  io.sockets.in(data.quizRoomID).emit('pauseGroupTimer');
}

function updateQNAset(data, testHooks) { //  data: {username, qnaSet}
  try {
    if (!checkArgs('updateQNASet', data, ['username', 'qnaSet'])) return;
    var username = data.username;
    var qnaSet = data.qnaSet;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;

    client.qnaSet[questionNumber] = qnaSet;
    // SAVE STUDENT GENERATED QNA AND TIMESTAMPS

  // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {qnaSet:client.qnaSet}};
//db[collections[USER_QUIZ_COLLECTION]].update(update_criteria, update_data, function(err, dbResults) {
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
  //console.log(new Date().toISOString(), username, update_criteria, update_data);
  /**
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {qnaSet:client.qnaSet}},
                                                 function(err, dbResults) {
 */
      if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log("#updateQNASet() ERROR - " +
                    "username: %s", username);
        if(err) console.log(err);
        socket.emit('db_failure', 'updateQNASet()');
      }
      else {
        console.log("#updateQNASet() - " +
                    "student-generated Q&A saved in database");
    //console.log(new Date().toISOString(), username, dbResults);
  }

    });

  }
  catch(err)
  {
    handleException(err);
  }
}

function saveDiscussionRating(data, testHooks) { //  data: {username, discussionRating}
  try {
    if (!checkArgs('saveDiscussionRating', data, ['username', 'discussionRating'])) return;
    var username = data.username;
    var discussionRating = data.discussionRating;
    var client = getClient(username);
    if (!client) return;
    var questionNumber = client.questionNumber;

    // SAVE DISCUSSION RATING
    // moocchat-30
var update_criteria = {socketID:client.socketID,
                                                  username:client.username,
                                                  questionGroup:conf.activeQuestionGroup};
var update_data = {$set: {discussionRating:discussionRating}};
//db[collections[USER_QUIZ_COLLECTION]].update(update_criteria, update_data, function(err, dbResults) {
db_wrapper.userquiz.update(update_criteria, update_data, function(err, dbResults) {
  //console.log(new Date().toISOString(), username, update_criteria, update_data);

  /*
    db[collections[USER_QUIZ_COLLECTION]].update({socketID:client.socketID,
                                                  username:username,
                                                  questionGroup:conf.activeQuestionGroup},
                                                 {$set: {discussionRating:discussionRating}},
                                                 function(err, dbResults) {

*/

  if ((typeof testHooks !== 'undefined') && (testHooks.location == 'afterUpdate')) {
        testHooks.callback();
      }
      if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
        console.log('#saveDiscussionRating() ERROR - ' +
                    'username: %s', username);
        if(err) console.log(err);
        socket.emit('db_failure', 'saveDiscussionRating()');
      }
      else {
        console.log('#saveDiscussionRating() - ' +
                    'discussion rating saved in database');

    //console.log(new Date().toISOString(), username, dbResults);

  }
    });
  }
  catch(err)
  {
    handleException(err);
  }
}

function sendForceProceed(data) {  //  data: {username, quizRoomID, stage}
  var stage = data.stage;
  var username = data.username;
  var quizRoomID = data.quizRoomID;
  var client = getClient(username);
  var quizRoom = activeQuizRooms[quizRoomID];

  switch(stage) {

    case STAGE.READ:

      break;

    // case STAGE.DISCUSSION:
    //   if(quizRoom.promptResps.length>=quizRoom.members.length) {
    //     io.sockets.in(quizRoomID).emit('promptResps', quizRoom.promptResps);
    //   }
    //   break;

    // case STAGE.PROBING_QUESTION:
    //   if(quizRoom.probAns.length>=quizRoom.members.length) {
    //     io.sockets.in(quizRoomID).emit('probAnswers', quizRoom.probAns);
    //   }
    //   break;

    // case STAGE.EXPLANATION:
    //   if(quizRoom.readyNum>=quizRoom.members.length) {
    //     io.sockets.in(quizRoomID).emit('postDiscussionStart');
    //     // quizRoom.readyNum = 0;
    //   }
    //   break;

    // case CLIENT_STAGE_POST_DISCUSSION:

    //   break;

    // case STAGE.EVALUATION:
    //   break;
  }
}

function readyForPostDiscussion(data) { //  data {quizRoomID}
  try {
    if (!checkArgs('readyForPostDiscussion', data, ['quizRoomID'])) return;

    var quizRoomID = data.quizRoomID;
    var quizRoom = activeQuizRooms[quizRoomID];

    quizRoom.quitReq = 0;
    quizRoom.readyNum++;

    if(quizRoom.readyNum==quizRoom.members.length) {
      io.sockets.in(quizRoomID).emit('postDiscussionStart');
      // quizRoom.readyNum = 0;
    }
  }
  catch(err) {
    handleException(err);
  }
}

function loadTest(data) {  //  SPECIAL EVENT HANDLER FOR LOAD TEST
  //db[collections[QUESTION_COLLECTION]].find({questionGroup:conf.activeQuestionGroup},
    db_wrapper.question.read({questionGroup:conf.activeQuestionGroup},
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
    if(err) {
      console.log(err);
    }
    else {
      console.log("The results has been saved to " + outputFilename);
    }
  });
}

    function disconnect() {
        var client = getClientFromSocket(socket);

        if (client) {
            removeClientFromEverything(client);
            delete activeClients[client.username];
        }
    }

//This records User's flow during the session
function user_flow(data) {
var username;
var search_criteria = {username:data.username};
  //db[collections[USER_FLOW_COLLECTION]].find({'username':data.username},function(err, dbResults) {
  db_wrapper.userflow.read({'username':data.username},function(err, dbResults) {
  //console.log(dbResults);
  if(err || typeof dbResults === 'undefined' || dbResults.length==0) {
     console.log("#UserFlow Table ERROR doesnt exist - " +
            "username: %s", username);
      if(err) console.log(err);
  }
   if (!err && dbResults == 0) {

      //db[collections[USER_FLOW_COLLECTION]].insert( {username:data.username, events:[{timestamp:data.timestamp, page:data.page, event:data.event, data:data.data}] } );
      db_wrapper.userflow.create({username:data.username, events:[{timestamp:data.timestamp, page:data.page, event:data.event, data:data.data}] }, function(err, res) {
       
      });
      }

  else {
    //db[collections[USER_FLOW_COLLECTION]].update(
    db_wrapper.userflow.update(
                            { username: data.username },
                            {
                              $addToSet: {
                                events:{
                                  $each: [{ timestamp:data.timestamp, event:data.event, page:data.page, data:data.data}]
                                }
                              }
                            }
                          )

  }

  });


}

});

}