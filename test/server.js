var conf = require('../config/conf.json');

var app = require('../app');

var server = global.server;
var io = global.io;

io.sockets.on('connection', function(socket) {
  function emitTestResult(result, getNextTest) {
      clearTimeout(testTimeout);
      result.error = typeof result.error !== 'undefined' ? result.error : '';
      console.log('in emitTestResult(). emitting: ' + result.name);
      var r = {'name':result.name,
               'verdict':result.verdict,
               'error':result.error.toString(),
               'args':result.argList,
               'stack':result.stack,
               'expected':result.expected,
               'obtainedResult':result.obtainedResult,
               'status':result.status};

      if (socket instanceof SocketStub) {
        socket.savedSocket.emit('testResult', r);
        socket = socket.savedSocket;
      }
      else {
        socket.emit('testResult', r);
      }
      if (io.sockets instanceof IOSocketsStub) {
        io.sockets = io.sockets.savedIOSockets;
      }

      getNextTest();

    }

    /* An object that enables iteration through test cases.

       @param states: the test cases through which to iterate
       @param currentStateNum: which test we are on right now

     */
    function TestGenerator (states) {
      this.states = states;
      this.currentStateNum = 0;
      this.hasNext = function() {
        return this.currentStateNum < this.states.length;
      };
      this.getNext = function() {
        var test = this.states[this.currentStateNum++];
        if (test.setup != undefined) {
          test.setup();
        }
        if (!this.hasNext()) {  test.status = 'final';  }
        return test;
      };
    }

    /*
       tests: each name:function mapping represents one test module to
       be performed.

       ex: addOne corresponds to unit tests of the addOne() function

       How to use:
         1. declare and initialize var testStates = []
         2. push a new testState (self-explanatory below) to testStates
           2a. declare a setup function as necessary and pass the function as a
               callback to the testState dictionary as 'setup':setupFunctionName
           2b. add to the setup declaration any database resets that
               must be performed
         3. create a new TestGenerator, passing the testStates in
         4. create a run() function that steps through the states
         5. call run()
     */
    var tests = {
      /* testCaller(fn, [args], expected, output_type) */
      addOne: function() {

        var testStates = [];
        testStates.push({'func': addOne,
                         'args': [1],
                         'expected': 2,
                         'replyType':'return'});
        testStates.push({'func': addOne,
                         'args': [-1],
                         'expected': 0,
                         'replyType':'return'});
        testStates.push({'func': addOne,
                         'args': [-2],
                         'expected': -1,
                         'replyType':'return'});
        testStates.push({'func': addOne,
                         'args': [-3],
                         'expected': -2,
                         'replyType':'return'});
        testStates.push({'func': addOne,
                         'args': [0],
                         'expected': 1,
                         'replyType':'return'});
        testStates.push({'func': addOne,
                         'args': [10],
                         'expected': 11,
                         'replyType':'return'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      checkArgs: function() {

        var testStates = [];
        testStates.push({'func': checkArgs,
                         'args': ['', {'a':'1', 'b':'2'}, ['a', 'b']],
                         'expected': true,
                         'replyType':'return'});
        testStates.push({'func': checkArgs,
                         'args': ['', {'b':'2', 'a':'1'}, ['a', 'b']],
                         'expected': true,
                         'replyType':'return'});
        testStates.push({'func': checkArgs,
                         'args': ['', {'a':'1', 'b':'2'}, ['a', 'c']],
                         'expected': false,
                         'replyType':'return'});
        testStates.push({'func': checkArgs,
                         'args': ['testFunc', {'a':'1', 'b':'2'}, ['a', 'c']],
                         'expected':['illegalMessage',
                                     'Missing argument: c in event testFunc'],
                         'replyType': 'emit'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      login: function() {
        var seeds = require('./test_db_seeds.js');
        var testStates = [];

        /* emit tests  */
        testStates.push({'func': login,
                         'args': [{'username':ADMIN_USERNAME,
                                   'password':ADMIN_PASSWORD}],
                         'expected': ['adminModeAccepted'],
                         'replyType': 'emit'});
        var setup = function() {
          activeClients = new Object();
          activeClients['mikey'] = new Object();
        }
        testStates.push({'func': login,
                         'args': [{'username':'mikey', 'password':'12345'}],
                         'expected': ['loginFailure',
                                       'The username is being used.'],
                         'replyType': 'emit',
                         'setup':setup});

        testStates.push({'func':login,
                         'args': [{'username':'derrick', 'password':'ischool'}],
                         'expected': ['loginSuccess', {'username':'derrick'}],
                         'replyType': 'emit'});
        testStates.push({'func': login,
                         'args': [{'username':'derrick', 'password':'ischool'}],
                         'expected':['loginFailure',
                                     'The username is being used.'],
                         'replyType': 'emit'});
        testStates.push({'func': login,
                         'args': [{'username':'dcoetzee', 'password':'ischool'}],
                         'expected': ['loginSuccess', {'username':'dcoetzee'}],
                         'replyType': 'emit'});

        /* db tests */

        /* Ensure that a user gets logged in properly */
        var db_test_setup = function() {
          activeClients = new Object();
        }
        var functionArgs = {'username':'mikey',
                            'password':'ischool'};
        var before = {'input':{'username':'mikey'},
                      'output':[]};
        var after = {'input':{'username':'mikey'},
                              'output':[{username: 'mikey',
                                         password: 'ischool',
                                         questionGroup: 0,
                                         _id:{ _bsontype: 'ObjectID',
                                               id: 'SNØ\u000bdäé\u0012q\u0000\u0000\f'}}]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterLoginInsert',
                              'collection':collections[USER_LOGIN_COLLECTION]};
        var test_state = {'func':login,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup}
        testStates.push(test_state);

        /* Repeat the above test to prove repeatability */
        var db_test_setup = function() {
          activeClients = new Object();
        }
        var functionArgs = {'username':'mikey',
                            'password':'ischool'};
        var before = {'input':{'username':'mikey'},
                      'output':[]};
        var after = {'input':{'username':'mikey'},
                              'output':[{username: 'mikey',
                                         password: 'ischool',
                                         questionGroup: 0,
                                         _id:{ _bsontype: 'ObjectID',
                                               id: 'SNØ\u000bdäé\u0012q\u0000\u0000\f'}}]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterLoginInsert',
                              'collection':collections[USER_LOGIN_COLLECTION]};
        var test_state = {'func':login,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup}
        testStates.push(test_state);

        // Demonstrate login bug whereby a user who is already in the DB
        // gets inserted again

        /*
        var db_test_setup = function() {
          activeClients = new Object();
        }
        var functionArgs = {'username':'dcoetzee',
                            'password':'ischool'};
        var before = {'input':{'username':'dcoetzee'},
                      'output':[{username: 'dcoetzee',
                                 password: 'ischool',
                                 questionGroup: 0}]};
        var after = {'input':{'username':'dcoetzee'},
                              'output':[{username: 'dcoetzee',
                                         password: 'ischool',
                                         questionGroup: 0,
                                         _id:{ _bsontype: 'ObjectID',
                                               id: 'SNØ\u000bdäé\u0012q\u0000\u0000\f'}}]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterLoginInsert',
                              'collection':collections[USER_LOGIN_COLLECTION]};
        var test_state = {'func':login,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup}
        testStates.push(test_state);
        */

        /* Ensure quiz state is initialized correctly */
        var functionArgs = {'username':'mikey',
                            'password':'ischool'};
        var before = {'input':{'username':'mikey'},
                      'output':[]};
        var after = {'input':{'username':'mikey'},
                              'output':[{username: 'mikey',
                                         firstChoices: [ -1 ],
                                         firstChoiceTimestamps: [ '' ],
                                         finalChoices: [ -1 ],
                                         finalChoiceTimestamps: [ '' ],
                                         studentGeneratedQuestions: [ [] ],
                                         studentGeneratedQuestionTimestamps: [ '' ],
                                         qnaSet: [ [] ],
                                         qnaSetTimestamps: [ '' ],
                                         quizIndex: 0,
                                         questionGroup: 0,
                                         _id: { _bsontype: 'ObjectID',
                                               id: 'SNØ\u000bdäé\u0012q\u0000\u0000\f'}}]};

        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUserQuizCollectionInsert',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':login,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup}
        testStates.push(test_state);

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            seeds.db_reset(function() {
              testCaller(generator.getNext(), run);
            });
          }
        }
        run();
      },
      getClient: function() {
        var setup = function() {
          activeClients['mikey'] = {'quizIndex':'0'};
        }
        var testStates = [];
        testStates.push({'func': getClient, 'args': ['Mikey'],
                         'expected': ['missingClient', {'username':'Mikey'}],
                         'replyType': 'emit'});
        testStates.push({'func': getClient, 'args': ['Mikey'],
                         'expected': ['missingClient', {'username':'Mikey'}],
                         'replyType': 'emit', 'setup':setup});
        testStates.push({'func': getClient, 'args': ['mikey'],
                         'expected': {'quizIndex':'0'}, 'replyType':'return'});
        testStates.push({'func': getClient, 'args': [null],
                         'expected': ['missingClient', {'username':''}],
                         'replyType': 'emit'});
        testStates.push({'func': getClient, 'args': ['armando'],
                         'expected': ['missingClient', {'username':'armando'}],
                         'replyType': 'emit'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      sendQuiz: function() {
        var seeds = require('./test_db_seeds.js');
        var q = seeds.questionCollection;
        var testStates = [];
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeQuizRooms['testRoom'].addMember(activeClients['mikey']);
          q['templateSlice'] = [ 'What is a new example of #blank#?' ];
        }
        testStates.push({'func':sendQuiz,
                         'args': [{'username':'mikey', 'quizRoomID':'testRoom'}],
                         'expected': ['quiz', {'username':'mikey',
                                               'quizRoomID':'testRoom',
                                               'quiz':q,}],
                         'replyType':'emit', 'setup':setup});
        var setup2 = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeClients['derrick'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeClients['taek'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeQuizRooms['testRoom'].addMember(activeClients['derrick']);
          activeQuizRooms['testRoom'].addMember(activeClients['mikey']);
          activeQuizRooms['testRoom'].addMember(activeClients['taek']);
          q['templateSlice'] = [ 'How does #blank# affect #blank#?' ];
        }
        testStates.push({'func':sendQuiz,
                         'args': [{'username':'mikey', 'quizRoomID':'testRoom'}],
                         'expected': ['quiz', {'username':'mikey',
                                               'quizRoomID':'testRoom',
                                               'quiz':q,}],
                         'replyType':'emit', 'setup':setup2});

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      quizWaitlist: function() {
        var setup = function() {
          activeClients['mikey'] = {'quizIndex': 2, 'quizCounter':2};
        }
        var testStates = [];
        var message = "You've completed this session. " +
                      "Please fill out the questionnaire.";
        testStates.push({'func':quizWaitlist, 'args':[{'username':'mikey'}],
                         'expected':['completed', {'message':message,
                                                   'postSurvey':POST_SURVEY,
                                                   'maxChoices':6}],
                         'replyType':'emit', 'setup':setup});

        var setup1 = function() {
          activeClients['mikey'] = {'quizIndex': -1, 'quizCounter':13};
        }
        message = "You've completed this session. " +
                  "Please fill out the questionnaire.";
        testStates.push({'func':quizWaitlist, 'args':[{'username':'mikey'}],
                         'expected':['completed', {'message':message,
                                                   'postSurvey':POST_SURVEY,
                                                   'maxChoices':6}],
                         'replyType':'emit', 'setup':setup1});

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      updateQuizWaitlist: function() {
        var setup = function() {
          activeClients = new Object();
          quizWaitlists = [ [] ];
          activeClients['armando'] = {'username':'armando', 'questionNumber':'0', 'conditionAssigned':'0'};
          activeClients['mikey'] = {'username':'mikey', 'questionNumber':'0', 'conditionAssigned':'0'};
          activeClients['derrick'] = {'username':'derrick', 'questionNumber':'0', 'conditionAssigned':'0'};
          quizWaitlists[0].push(activeClients['armando']);
          quizWaitlists[0].push(activeClients['mikey']);
          quizWaitlists[0].push(activeClients['derrick']);
        }
        setup();
        try {
          assert(quizWaitlists[0].length == 3);
          updateQuizWaitlist({'username':'gina', 'quizRoomID':'testRoom'});
          assert(quizWaitlists[0].length == 3);
          assert(activeClients['mikey'].equals({'username':'mikey',
                                                'questionNumber':'0',
                                                'conditionAssigned':'0'}));
          assert(activeClients['derrick'].equals({'username':'derrick',
                                                  'questionNumber':'0',
                                                  'conditionAssigned':'0'}));
          results = {'name':'updateQuizWaitlist',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'updateQuizWaitlist',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }
        setup();
        try {
          assert(quizWaitlists[0].length == 3);
          updateQuizWaitlist({'username':'armando', 'quizRoomID':'testRoom'});
          assert(quizWaitlists[0].length == 2);
          assert(activeClients['armando'].equals({'username':'armando',
                                                  'questionNumber':'0',
                                                  'conditionAssigned':'0',
                                                  'clientState':CLIENT_STATE_IDLE}));
          assert(activeClients['derrick'].equals({'username':'derrick',
                                                  'questionNumber':'0',
                                                  'conditionAssigned':'0'}));
          results = {'name':'updateQuizWaitlist',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'updateQuizWaitlist',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }
        setup();
        try {
          assert(quizWaitlists[0].length == 3);
          updateQuizWaitlist({'username':'mikey', 'quizRoomID':'testRoom'});
          assert(quizWaitlists[0].length == 2);
          assert(activeClients['mikey'].equals({'username':'mikey',
                                                'questionNumber':'0',
                                                'conditionAssigned':'0',
                                                'clientState':CLIENT_STATE_IDLE}));
          assert(activeClients['derrick'].equals({'username':'derrick',
                                                  'questionNumber':'0',
                                                  'conditionAssigned':'0'}));
          results = {'name':'updateQuizWaitlist',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'updateQuizWaitlist',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }
        setup();
        try {
          assert(quizWaitlists[0].length == 3);
          updateQuizWaitlist({'username':'derrick', 'quizRoomID':'testRoom'});
          assert(quizWaitlists[0].length == 2);
          assert(activeClients['mikey'].equals({'username':'mikey',
                                                'questionNumber':'0',
                                                'conditionAssigned':'0'}));
          assert(activeClients['derrick'].equals({'username':'derrick',
                                                  'questionNumber':'0',
                                                  'conditionAssigned':'0',
                                                  'clientState':CLIENT_STATE_IDLE}));
          results = {'name':'updateQuizWaitlist',
                     'verdict':'pass',
                     'status':'final'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'updateQuizWaitlist',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack,
                     'status':'final'};
          emitTestResult(results, function() {});
        }






        /*
        var testStates = [];
        testStates.push({'func':updateQuizWaitlist, 'args':[{'username':'mikey',
                                                             'quizRoomID':'testRoom'}],
                         'expected':['completed', {'message':message,
                                                   'postSurvey':POST_SURVEY,
                                                   'maxChoices':6}],
                         'replyType':'emit', 'setup':setup});

        var setup1 = function() {
          activeClients['mikey'] = {'quizIndex': -1, 'quizCounter':13};
        }
        message = "You've completed this session. " +
                  "Please fill out the questionnaire.";
        testStates.push({'func':quizWaitlist, 'args':[{'username':'mikey'}],
                         'expected':['completed', {'message':message,
                                                   'postSurvey':POST_SURVEY,
                                                   'maxChoices':6}],
                         'replyType':'emit', 'setup':setup1});

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
        */
      },
      joinQuizRoom: function() {
        var testStates = [];
        var setup = function() {
          activeClients['mikey'] = {'username':'mikey', 'quizIndex':'0'};
        }
        var input = {'username':'mikey', 'quizRoomID':0};
        testStates.push({'func':joinQuizRoom, 'args':[input],
                         'expected':['joinedForQuiz', input],
                         'replyType':'emit', 'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      getConsent: function() {
        testStates = [];
        testStates.push({'func':getConsent, 'args':[{'username':'dcoetzee'}],
                         'expected':['getConsentComplete', 1],
                         'replyType':'emit'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      setConsent: function() {
        testStates = [];
        testStates.push({'func':setConsent,
                         'args':[{'username':'dcoetzee', 'value':'0'}],
                         'expected':['setConsentComplete'],
                         'replyType':'emit'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      broadcastMessage: function() {
        var testStates = [];
        var broadcastArgs = {'username':'derrick',
                             'discussionRoomID':'testRoom',
                             'screenName':'dcoetzee',
                             'firstChoice':'0',
                             'message':'hello world'};

        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeDiscussionRooms['testRoom'] =
            new DiscussionRoom('testRoom', 0, 0);
        }

        testStates.push({'func':broadcastMessage,
                         'args':[broadcastArgs],
                         'expected':['message', broadcastArgs],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        testStates.push({'func': broadcastMessage,
                         'args': [{'username':'derrick',
                                   'discussionRoomID':0,
                                   'screenName':'coetzee',
                                   'firstChoice':'1',
                                   'message':'testing'}],
                         'expected': null,
                         'replyType':'return',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      broadcastWelcomeMessage: function() {
        var testStates = [];
        var broadcastArgs = {'username':'derrick',
                             'discussionRoomID':'testRoom',
                             'screenName':'dcoetzee',
                             'firstChoice':'0',
                             'message':SYSTEM_WELCOME_MESSAGE};
        var expected = {'username':SYSTEM_MESSAGE_SOURCE,
                        'discussionRoomID':'testRoom',
                        'screenName':'dcoetzee',
                        'firstChoice':'0',
                        'message':SYSTEM_WELCOME_MESSAGE};

        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeDiscussionRooms['testRoom'] =
            new DiscussionRoom('testRoom', 0, 0);
        }

        testStates.push({'func':broadcastWelcomeMessage,
                         'args':[broadcastArgs],
                         'expected':['message', expected],
                         'replyType':'emit_to_room', 'setup':setup});
        testStates.push({'func': broadcastWelcomeMessage,
                         'args': [{'username':'derrick',
                                   'discussionRoomID':0,
                                   'screenName':'coetzee',
                                   'firstChoice':'1',
                                   'message':'testing'}],
                         'expected': null,
                         'replyType':'return',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      broadcastDiscussionQuit: function() {
        var testStates = [];
        var broadcastArgs_1 = {'quizRoomID':'testRoom',
                               'screenName':'dcoetzee',
                               'wantToQuit':true};
        var expected_1 = {'screenName':'dcoetzee',
                          'wantToQuit':true,
                          'numMembers':1,
                          'quitReq':1};


        var broadcastArgs_2 = {'quizRoomID':'testRoom',
                               'screenName':'dcoetzee',
                               'wantToQuit':false};
        var expected_2 = {'screenName':'dcoetzee',
                          'wantToQuit':false,
                          'numMembers':1,
                          'quitReq':-1};
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms = io.sockets.rooms.rooms;
        }

        testStates.push({'func':broadcastDiscussionQuit,
                         'args':[broadcastArgs_1],
                         'expected':['requestToQuitUpdated', expected_1],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});

        testStates.push({'func': broadcastDiscussionQuit,
                         'args': [broadcastArgs_2],
                         'expected': ['requestToQuitUpdated', expected_2],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      handleException: function() {
        var testStates = [];
        var input = {'message':'some fake message', 'stack':'some fake stack'};
        testStates.push({'func':handleException, 'args':[input],
                         'expected':['illegalMessage', 'Unexpected exception: some fake message\nsome fake stack'],
                         'replyType':'emit'});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {  testCaller(generator.getNext(), run); }
        }
        run();
      },
      quizWaitlistForceProceed: function() {
        var testArgs1 = {'username':'dcoetzee'};
        var results = {};
        var setup = function() {
          activeClients = new Object();
          activeClients['dcoetzee'] = {'conditionAssigned':'0'};
          createQuizGroup = function(username, questionNumber, conditionAssigned, testHook) {
            results.username = username;
            results.questionNumber = questionNumber;
            results.conditionAssigned = conditionAssigned;
            results.testHook = testHook;
          }
        }
        setup();

        try {
          assert(results.equals({}));
          quizWaitlistForceProceed({'username':'dcoetzee'});
          assert(results.equals({'username':'dcoetzee',
                                 'questionNumber':0,
                                 'conditionAssigned':'0',
                                 'testHook':undefined}));
          results = {'name':'quizWaitlistForceProceed',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'quizWaitlistForceProceed',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }


        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      createQuizGroup: function() {
        var testStates = [];
        var expected_1 = {'username':'mikey',
                          'quizRoomID':'quiz_0_mikey_0',
                          'questionNumber':0,
                          'conditionAssigned':0,
                          'conditionSet':CONDITION_SET,
                          'numMembers':1};
        var setup = function() {
          casePointer = 0;
          io.sockets = new IOSocketsStub();
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'quiz_0_mikey_0', 'questionNumber':'0'};
          quizWaitlists[0].push({'username':'mikey', 'conditionAssigned':0, 'socketID':socket.id})
        }
        testStates.push({'func':createQuizGroup,
                         'args':['mikey', 0, 0],
                         'expected':['groupedForQuiz', expected_1],
                         'replyType':'emit', 'setup':setup});

        /* Database testing section */
        var db_test_setup = function() {
          casePointer = 0;
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'quiz_0_gina_0', 'questionNumber':'0'};
          quizWaitlists[0].push({'username':'gina', 'conditionAssigned':0, 'socketID':socket.id})
        }

        var functionArgs = ['gina', 0, 0];
        var before = {'input':{'quizRoomID':'quiz_0_gina_0'}, 'output':[]};
        var after = {'input':{'quizRoomID':'quiz_0_gina_0'},
                     'output':[{'quizRoomID': 'quiz_0_gina_0',
                                'questionGroup': 0,
                                'questionNumber': 0,
                                'members': [],
                                'conditionAssigned': 0}]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterInsert',
                              'collection':collections[QUIZ_ROOM_COLLECTION]};
        var test_state = {'func':createQuizGroup,
                          'args':functionArgs,
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);


        var db_test_setup2 = function() {
          casePointer = 0;
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'quiz_0_armando_0', 'questionNumber':'0'};
          quizWaitlists[0] = [];
          quizWaitlists[0].push({'username':'armando', 'conditionAssigned':0, 'socketID':socket.id})
        }
        var functionArgs2 = ['armando', 0, 0];
        var before2 = {'input':{'quizRoomID':'quiz_0_armando_0'}, 'output':[]};
        var after2 = {'input':{'quizRoomID':'quiz_0_armando_0'},
                     'output':[{'quizRoomID': 'quiz_0_armando_0',
                                'questionGroup': 0,
                                'questionNumber': 0,
                                'members': [],
                                'conditionAssigned': 0}]};
        var beforeAndAfter2 = {'before':before2,
                              'after':after2,
                              'where':'afterUpdate',
                              'collection':collections[QUIZ_ROOM_COLLECTION]};
        var test_state2 = {'func':createQuizGroup,
                          'args':functionArgs2,
                          'expected':beforeAndAfter2,
                          'replyType':'database',
                          'setup':db_test_setup2};
        testStates.push(test_state2);


        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      createDiscussionGroup: function() {
        var testStates = [];
        var expected_1 = {'username':'mikey',
                          'discussionRoomID':'discussion_0_0_mikey_0',
                          'conditionAssigned':0};
        var setup = function() {
          casePointer = 0;
          io.sockets = new IOSocketsStub();
          discussionWaitlists[0].push([{'username':'mikey', 'conditionAssigned':0, 'socketID':socket.id}])
        }
        testStates.push({'func':createDiscussionGroup,
                         'args':['mikey', 0, 0, 0],
                         'expected':['groupedForDiscussion', expected_1],
                         'replyType':'emit', 'setup':setup});

        /* Database testing section */
        var db_test_setup = function() {
          casePointer = 0;
          discussionWaitlists = [ [] ];
          discussionWaitlists[0].push([{'username':'mikey', 'conditionAssigned':0, 'socketID':socket.id}])
        }

        var functionArgs = ['gina', 0, 0, 0];
        var before = {'input':{'disussionRoomID':'discussion_0_0_gina_0'}, 'output':[]};
        var after = {'input':{'discussionRoomID':'discussion_0_0_gina_0'},
                     'output':[{'discussionRoomID': 'discussion_0_0_gina_0',
                                'questionGroup':ACTIVE_QUESTION_GROUP,
                                'quizIndex': 0,
                                'questionNumber': 0,
                                'conditionAssigned':0,
                                'members': [],
                                'chatLog': []}]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterInsert',
                              'collection':collections[DISCUSSION_ROOM_COLLECTION]};
        var test_state = {'func':createDiscussionGroup,
                          'args':functionArgs,
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      updateQNAset: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');

        var setup = function() {
          activeClients = new Object();
          activeClients['mikey'] = {'username':'mikey',
                                    'questionNumber':'0',
                                    'conditionAssigned':'0',
                                    'qnaSet':{}};
        }
        setup();
        try {
          assert(getClient('mikey').equals({'username':'mikey',
                                            'questionNumber':'0',
                                            'conditionAssigned':'0',
                                            'qnaSet':{}}));
          updateQNAset({'username':'mikey', 'qnaSet':'blahblahSet'});
          assert(getClient('mikey').equals({'username':'mikey',
                                            'questionNumber':'0',
                                            'conditionAssigned':'0',
                                            'qnaSet':{'0':'blahblahSet'}}));
          results = {'name':'updateQNAset',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'updateQNAset',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }

        /* Database testing section */
        var db_test_setup = function() {
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'0', 'qnaSet':{}};
        }
        var entryBefore = seeds.userQuizCollection;
        var entryAfter = { "bonusCondition" : 0,
                           "finalChoiceTimestamps" : ["",  "",  "",  ""  ],
                           "finalChoices" : [-1, -1, -1, -1 ],
                           "firstChoiceTimestamps" : ["2013-12-10T19:28:20.112Z",
                                                      "2013-12-10T19:33:34.338Z",
                                                      "",
                                                      "" ],
                           "firstChoices" : [-1, 1, -1, -1],
                           "qnaSet": {'0': {'set':'someFakeSet'}},
                           "questionGroup" : 0,
                           "questionNumber" : NaN,
                           "quizIndex" : 1,
                           "username" : "dcoetzee" };
        var functionArgs = {'username':'dcoetzee', 'qnaSet':{'set':'someFakeSet'}};
        var before = {'input':{'username':'dcoetzee'}, 'output':[entryBefore]};
        var after = {'input':{'username':'dcoetzee'},
                     'output':[entryAfter]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUpdate',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':updateQNAset,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      saveQNASet: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');

        var setup = function() {
          activeClients = new Object();
          activeClients['dcoetzee'] = {'username':'dcoetzee',
                                       'questionNumber':'0',
                                       'conditionAssigned':'0',
                                       'qnaSet':{},
                                       'qnaSetTimestamps':{}};
          activeQuizRooms = new Object();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          Date.prototype.toISOString = function() { return "Jan-2-1979"; }
        }
        setup();
        try {
          assert(getClient('dcoetzee').equals({'username':'dcoetzee',
                                               'questionNumber':'0',
                                               'conditionAssigned':'0',
                                               'qnaSet':{},
                                               'qnaSetTimestamps':{}}));
          saveQNASet({'username':'dcoetzee', 'qnaSet':'blahblahSet', 'quizRoomID':'testRoom'});
          assert(getClient('dcoetzee').equals({'username':'dcoetzee',
                                               'questionNumber':'0',
                                               'conditionAssigned':'0',
                                               'qnaSet':{'0':'blahblahSet'},
                                               'qnaSetTimestamps':{'0':'Jan-2-1979'}}));
          results = {'name':'saveQNASet',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'saveQNASet',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }


        /* Database testing section */
        var db_test_setup = function() {
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'0', 'qnaSet':{}, 'qnaSetTimestamps':{}};
          activeQuizRooms = new Object();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          Date.prototype.toISOString = function() { return "Jan-2-1979"; }
        }
        var entryBefore = seeds.userQuizCollection;
        var entryAfter = { "bonusCondition" : 0,
                           "finalChoiceTimestamps" : ["",  "",  "",  ""  ],
                           "finalChoices" : [-1, -1, -1, -1 ],
                           "firstChoiceTimestamps" : ["2013-12-10T19:28:20.112Z",
                                                      "2013-12-10T19:33:34.338Z",
                                                      "",
                                                      "" ],
                           "firstChoices" : [-1, 1, -1, -1],
                           "qnaSet": {'0': {'set':'someFakeSet'}},
                           "qnaSetTimestamps": {'0': 'Jan-2-1979'},
                           "questionGroup" : 0,
                           "questionNumber" : NaN,
                           "quizIndex" : 1,
                           "username" : "dcoetzee" };
        var functionArgs = {'username':'dcoetzee', 'quizRoomID':'testRoom', 'qnaSet':{'set':'someFakeSet'}};
        var before = {'input':{'username':'dcoetzee'}, 'output':[entryBefore]};
        var after = {'input':{'username':'dcoetzee'},
                     'output':[entryAfter]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUpdate',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':saveQNASet,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            seeds.db_reset(function() {
              testCaller(generator.getNext(), run);
            });
          }
        }
        run();
      },
      broadcastQNASet: function() {
        var testStates = [];
        var broadcastArgs = 'testRoom';
        var fakeQNASet = {'0':{'set':'someFakeSet'}};
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
          activeQuizRooms['testRoom'].qnaSets.push(fakeQNASet);
        }

        testStates.push({'func':broadcastQNASet,
                         'args':[broadcastArgs],
                         'expected':['shareQNAs', [fakeQNASet]],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      broadcastPeerGeneratedQuestions: function() {
        var testStates = [];
        var broadcastArgs = 'testRoom';
        var fakeQuestions = ['What is your name?',
                             'What is your quest?',
                             'What is your favorite color?'];
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
          activeQuizRooms['testRoom'].peerGeneratedQuestions = fakeQuestions;
        }

        testStates.push({'func':broadcastPeerGeneratedQuestions,
                         'args':[broadcastArgs],
                         'expected':['shareQuestions', fakeQuestions],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      broadcastChatMessage: function() {
        var testStates = [];
        var broadcastArgs = {'username':'mikey',
                             'quizRoomID':'testRoom',
                             'screenName':'badpimp2112',
                             'message':'hey yall!'};
        var afterChatLogs = {'username':'mikey',
                             'quizRoomID':'testRoom',
                             'screenName':'badpimp2112',
                             'message':'hey yall!',
                             'timestamp':'Jan-2-1979'};
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
          Date.prototype.toISOString = function() { return "Jan-2-1979"; }
        }

        setup();
        try {
          assert(activeQuizRooms['testRoom'].chatLog.equals([]));
          broadcastChatMessage(broadcastArgs);
          assert(activeQuizRooms['testRoom'].chatLog.equals([afterChatLogs]));
          results = {'name':'saveQNASet',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'saveQNASet',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }

        testStates.push({'func':broadcastChatMessage,
                         'args':[broadcastArgs],
                         'expected':['chatMessage', broadcastArgs],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      sendUserList: function() {
        var testStates = [];
        var expected = [{'username':'mikey', 'screenName':SCREEN_NAME_PREFIX+1},
                        {'username':'derrick', 'screenName':SCREEN_NAME_PREFIX+2},
                        {'username':'armando', 'screenName':SCREEN_NAME_PREFIX+3}];
        var args = {'quizRoomID':'testRoom',
                    'username':'unnecessary'};
        var setup = function() {
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          activeQuizRooms['testRoom'].members = [{'username':'mikey'},
                                                 {'username':'derrick'},
                                                 {'username':'armando'}];
        }
        testStates.push({'func':sendUserList,
                         'args':[args],
                         'expected':['userList', expected],
                         'replyType':'emit', 'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      pauseGroupTimer: function() {
        var testStates = [];
        var broadcastArgs = {'quizRoomID':'testRoom'};
        var setup = function() {
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
        }
        testStates.push({'func':pauseGroupTimer,
                         'args':[broadcastArgs],
                         'expected':['pauseGroupTimer', null],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      sendForceProceed: function() {
        var testStates = [];
        var broadcastArgs = {'stage':CLIENT_STAGE_READ_AND_GENERATE,
                             'username':'mikey',
                             'quizRoomID':'testRoom'};
        var fakeQuestions = ['What is your name?',
                             'What is your quest?',
                             'What is your favorite color?'];
        var setup = function() {
          activeClients = new Object();
          activeClients['mikey'] = {};
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
          activeQuizRooms['testRoom'].peerGeneratedQuestions = fakeQuestions;
        }

        testStates.push({'func':sendForceProceed,
                         'args':[broadcastArgs],
                         'expected':['shareQuestions', fakeQuestions],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup});
        var broadcastArgs1 = {'stage':CLIENT_STAGE_SHARE_AND_SOLVE,
                               'username':'mikey',
                               'quizRoomID':'testRoom'};
        var setup1 = function() {
          activeClients = new Object();
          activeClients['mikey'] = {};
          io.sockets = new IOSocketsStub();
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', 0);
          activeQuizRooms['testRoom'].qnaSets = fakeQuestions;
        }
        testStates.push({'func':sendForceProceed,
                         'args':[broadcastArgs1],
                         'expected':['shareQNAs', fakeQuestions],
                         'replyType':'emit_to_room',
                         'join':'testRoom',
                         'setup':setup1});
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      saveDiscussionRating: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');

        var db_test_setup = function() {
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'0', 'qnaSet':{}, 'qnaSetTimestamps':{}};
        }
        var entryBefore = seeds.userQuizCollection;
        var entryAfter = { "bonusCondition" : 0,
                           "discussionRating": 5,
                           "finalChoiceTimestamps" : ["",  "",  "",  ""  ],
                           "finalChoices" : [-1, -1, -1, -1 ],
                           "firstChoiceTimestamps" : ["2013-12-10T19:28:20.112Z",
                                                      "2013-12-10T19:33:34.338Z",
                                                      "",
                                                      "" ],
                           "firstChoices" : [-1, 1, -1, -1],
                           "questionGroup" : 0,
                           "questionNumber" : NaN,
                           "quizIndex" : 1,
                           "username" : "dcoetzee" };
        var functionArgs = {'username':'dcoetzee', 'discussionRating':'5'};
        var before = {'input':{'username':'dcoetzee'}, 'output':[entryBefore]};
        var after = {'input':{'username':'dcoetzee'},
                     'output':[entryAfter]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUpdate',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':saveDiscussionRating,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            seeds.db_reset(function() {
              testCaller(generator.getNext(), run);
            });
          }
        }
        run();
      },
      saveProbingQuestionAnswer: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');

        var db_test_setup = function() {
          Date.prototype.toISOString = function() { return 'Jan-2-1979'; }
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'2',
                                       'probingQuestionAnswers':{},
                                       'probingQuestionAnswerTime':{}};
        }
        var entryBefore = seeds.userQuizCollection;
        var entryAfter = { "bonusCondition" : 0,
                           "finalChoiceTimestamps" : ["",  "",  "",  ""  ],
                           "finalChoices" : [-1, -1, -1, -1 ],
                           "firstChoiceTimestamps" : ["2013-12-10T19:28:20.112Z",
                                                      "2013-12-10T19:33:34.338Z",
                                                      "",
                                                      "" ],
                           "firstChoices" : [-1, 1, -1, -1],
                           "probingQuestionAnswerTime" : { '2': 'Jan-2-1979' },
                           "probingQuestionAnswers" : { '2': 'An African or European swallow?' },
                           "questionGroup" : 0,
                           "questionNumber" : NaN,
                           "quizIndex" : 1,
                           "username" : "dcoetzee" };
        var functionArgs = {'username':'dcoetzee',
                            'questionNumber':'2',
                            'answer':'An African or European swallow?'};
        var before = {'input':{'username':'dcoetzee'}, 'output':[entryBefore]};
        var after = {'input':{'username':'dcoetzee'},
                     'output':[entryAfter]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUpdate',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':saveProbingQuestionAnswer,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            seeds.db_reset(function() {
              testCaller(generator.getNext(), run);
            });
          }
        }
        run();
      },
      saveStudentGeneratedQuestions: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');
        var burningQuestions = ['Who?', 'What?', 'When?', 'Where?', 'Why?', 'How?'];
        var functionArgs = {'username':'dcoetzee',
                            'quizRoomID':'testRoom',
                            'studentGeneratedQuestions':burningQuestions};
        var setup = function() {
          io.sockets = new IOSocketsStub();
          Date.prototype.toISOString = function() { return 'Jan-2-1979'; }
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'2',
                                       'studentGeneratedQuestions':{},
                                       'studentGeneratedQuestionTimestamps':{}};
          activeClients['mikey'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeClients['taek'] = {'quizIndex':'0', 'quizRoomID':'testRoom', 'questionNumber':'0'};
          activeQuizRooms['testRoom'].addMember(activeClients['dcoetzee']);
          activeQuizRooms['testRoom'].addMember(activeClients['mikey']);
          activeQuizRooms['testRoom'].addMember(activeClients['taek']);
          activeQuizRooms['testRoom'].peerGeneratedQuestions.push({'username':'mikey',
                                                                   'studentGeneratedQuestions':['first q set']});
          activeQuizRooms['testRoom'].peerGeneratedQuestions.push({'username':'taek',
                                                                   'studentGeneratedQuestions':['first q set']});
        }

        setup();
        try {
          var beforeTestQuestions = [{'username':'mikey',
                                'studentGeneratedQuestions':['first q set']},
                               {'username':'taek',
                                'studentGeneratedQuestions':['first q set']}];
          assert(activeQuizRooms['testRoom'].peerGeneratedQuestions.equals(beforeTestQuestions));
          saveStudentGeneratedQuestions(functionArgs);
          var afterTestQuestions = [{'username':'mikey',
                                     'studentGeneratedQuestions':['first q set']},
                                    {'username':'taek',
                                     'studentGeneratedQuestions':['first q set']},
                                    {'username':'dcoetzee',
                                     'studentGeneratedQuestions':burningQuestions}];
          assert(activeQuizRooms['testRoom'].peerGeneratedQuestions.equals(afterTestQuestions));
          results = {'name':'saveStudentGeneratedQuestions',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'saveStudentGeneragedQuestions',
                     'verdict':'fail',
                     'error':err,
                     'args':[],
                     'stack': err.stack};
          emitTestResult(results, function() {});
        }

        var expected = [ 'shareQuestions',
                         [ { username: 'mikey', studentGeneratedQuestions: ['first q set'] },
                           { username: 'taek', studentGeneratedQuestions: ['first q set'] },
                           { username: 'dcoetzee', studentGeneratedQuestions: burningQuestions } ] ]
        var test_state = {'func':saveStudentGeneratedQuestions,
                          'args':[functionArgs],
                          'expected':expected,
                          'replyType':'emit_to_room',
                          'join':'testRoom',
                          'setup':setup};
        testStates.push(test_state);

        var db_test_setup = function() {
          Date.prototype.toISOString = function() { return 'Jan-2-1979'; }
          activeClients = new Object();
          activeClients['dcoetzee'] = {'questionNumber':'2',
                                       'studentGeneratedQuestions':{},
                                       'studentGeneratedQuestionTimestamps':{}};
        }
        var entryBefore = seeds.userQuizCollection;
        var entryAfter = { "bonusCondition" : 0,
                           "finalChoiceTimestamps" : ["",  "",  "",  ""  ],
                           "finalChoices" : [-1, -1, -1, -1 ],
                           "firstChoiceTimestamps" : ["2013-12-10T19:28:20.112Z",
                                                      "2013-12-10T19:33:34.338Z",
                                                      "",
                                                      "" ],
                           "firstChoices" : [-1, 1, -1, -1],
                           "questionGroup" : 0,
                           "questionNumber" : NaN,
                           "quizIndex" : 1,
                           "studentGeneratedQuestionTimestamps" : { '2': 'Jan-2-1979' },
                           "studentGeneratedQuestions" : {'2': ['Who?', 'What?', 'When?', 'Where?', 'Why?', 'How?']},
                           "username" : "dcoetzee" };
        var functionArgs = {'username':'dcoetzee',
                            'quizRoomID':'testRoom',
                            'studentGeneratedQuestions':['Who?', 'What?', 'When?', 'Where?', 'Why?', 'How?']};
        var before = {'input':{'username':'dcoetzee'}, 'output':[entryBefore]};
        var after = {'input':{'username':'dcoetzee'},
                     'output':[entryAfter]};
        var beforeAndAfter = {'before':before,
                              'after':after,
                              'where':'afterUpdate',
                              'collection':collections[USER_QUIZ_COLLECTION]};
        var test_state = {'func':saveStudentGeneratedQuestions,
                          'args':[functionArgs],
                          'expected':beforeAndAfter,
                          'replyType':'database',
                          'setup':db_test_setup};
        testStates.push(test_state);
        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            seeds.db_reset(function() {
              testCaller(generator.getNext(), run);
            });
          }
        }
        run();
      },
      disconnect: function() {
        var testStates = [];
        var seeds = require('./test_db_seeds.js');
        var setup_for_quiz_waitlist = function() {

          activeClients = new Object();
          activeClients['dcoetzee'] = {'username':'dcoetzee',
                                       'socketID':socket.id,
                                       'conditionAssigned':0,
                                       'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                       'questionNumber':'0'};
          activeClients['mikey'] = {'username':'mikey',
                                    'socketID':12345,
                                    'conditionAssigned':0,
                                    'questionNumber':'0'};
          activeClients['taek'] = {'username':'taek',
                                   'socketID':12468,
                                   'conditionAssigned':0,
                                   'questionNumber':'0'};

          quizWaitlists = [ [] ];
          quizWaitlists[0].push(activeClients['mikey']);
          quizWaitlists[0].push(activeClients['dcoetzee']);
          quizWaitlists[0].push(activeClients['taek']);

        }
        setup_for_quiz_waitlist();
        try {
          assert(activeClients['dcoetzee'].equals({'username':'dcoetzee',
                                                   'socketID':socket.id,
                                                   'conditionAssigned':0,
                                                   'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                                   'questionNumber':'0'}));
          disconnect();
          assert(activeClients['dcoetzee'] == undefined);
          results = {'name':'disconnect',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'disconnect',
                     'verdict':'fail',
                     'error':'derrick didnt disconnect.',
                     'args':[],
                     'stack':'derrick did not disconnect'};
          emitTestResult(results, function() {});
        }
        var setup_for_quiz_waitlist = function() {

          activeClients = new Object();
          activeClients['dcoetzee'] = {'username':'dcoetzee',
                                       'socketID':socket.id,
                                       'conditionAssigned':0,
                                       'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                       'questionNumber':'0'};
          activeClients['mikey'] = {'username':'mikey',
                                    'socketID':12345,
                                    'conditionAssigned':0,
                                    'questionNumber':'0'};
          activeClients['taek'] = {'username':'taek',
                                   'socketID':12468,
                                   'conditionAssigned':0,
                                   'questionNumber':'0'};

          quizWaitlists = [ [] ];

          quizWaitlists[0].push(activeClients['dcoetzee']);
          quizWaitlists[0].push(activeClients['mikey']);
          quizWaitlists[0].push(activeClients['taek']);

        }
        setup_for_quiz_waitlist();
        try {
          assert(activeClients['dcoetzee'].equals({'username':'dcoetzee',
                                                   'socketID':socket.id,
                                                   'conditionAssigned':0,
                                                   'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                                   'questionNumber':'0'}));
          disconnect();
          assert(activeClients['dcoetzee'] == undefined);
          results = {'name':'disconnect',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'disconnect',
                     'verdict':'fail',
                     'error':'derrick didnt disconnect.',
                     'args':[],
                     'stack':'derrick did not disconnect'};
          emitTestResult(results, function() {});
        }
        var setup_for_quiz_waitlist = function() {

          activeClients = new Object();
          activeClients['dcoetzee'] = {'username':'dcoetzee',
                                       'socketID':socket.id,
                                       'conditionAssigned':0,
                                       'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                       'questionNumber':'0'};
          activeClients['mikey'] = {'username':'mikey',
                                    'socketID':12345,
                                    'conditionAssigned':0,
                                    'questionNumber':'0'};
          activeClients['taek'] = {'username':'taek',
                                   'socketID':12468,
                                   'conditionAssigned':0,
                                   'questionNumber':'0'};

          quizWaitlists = [ [] ];


          quizWaitlists[0].push(activeClients['mikey']);
          quizWaitlists[0].push(activeClients['taek']);
          quizWaitlists[0].push(activeClients['dcoetzee']);
        }
        setup_for_quiz_waitlist();
        try {
          assert(activeClients['dcoetzee'].equals({'username':'dcoetzee',
                                                   'socketID':socket.id,
                                                   'conditionAssigned':0,
                                                   'clientState': CLIENT_STATE_QUIZ_WAITLIST,
                                                   'questionNumber':'0'}));
          disconnect();
          assert(activeClients['dcoetzee'] == undefined);
          results = {'name':'disconnect',
                     'verdict':'pass'};
          emitTestResult(results, function() {});
        }
        catch (err) {
          results = {'name':'disconnect',
                     'verdict':'fail',
                     'error':'derrick didnt disconnect.',
                     'args':[],
                     'stack':'derrick did not disconnect'}
          emitTestResult(results, function() {});
        }

        var setup_for_quizroom = function() {
          io.sockets = new IOSocketsStub();
          activeClients = new Object();
          activeClients['dcoetzee'] = {'username':'dcoetzee',
                                       'socketID':socket.id,
                                       'conditionAssigned':0,
                                       'clientState': CLIENT_STATE_QUIZROOM,
                                       'quizRoomID':'testRoom',
                                       'questionNumber':'0'};
          activeClients['mikey'] = {'username':'mikey',
                                    'socketID':12345,
                                    'conditionAssigned':0,
                                    'questionNumber':'0'};
          activeClients['taek'] = {'username':'taek',
                                   'socketID':12468,
                                   'conditionAssigned':0,
                                   'questionNumber':'0'};
          activeQuizRooms['testRoom'] = new QuizRoom('testRoom', '0');
          activeQuizRooms['testRoom'].addMember(activeClients['dcoetzee']);
          activeQuizRooms['testRoom'].addMember(activeClients['taek']);
          activeQuizRooms['testRoom'].addMember(activeClients['mikey']);
        }

        var testStates = [];
        var args = undefined;
        var test_state = {'func':disconnect,
                          'args':[args],
                          'expected':['memberDisconnected', 'dcoetzee'],
                          'replyType':'emit_to_room',
                          'join':'testRoom',
                          'setup':setup_for_quizroom};
        testStates.push(test_state);

        var generator = new TestGenerator(testStates);
        var run = function() {
          if (generator.hasNext()) {
            testCaller(generator.getNext(), run); }
        }
        run();
      },
      finishTesting: function() {
        socket.emit('testsFinished');
      },
    };

    /*
     function runTest(arg):
       calls a given unit test listed in the tests object

       @param arg:  should have format {'test':<testName>}

       ex:  runtest({'test':'addOne'});
     */
    function runTest(arg) {
      testTimeout = setTimeout(function() { timeoutFail(arg.test); }, 5000);
      tests[arg.test]();
    }

    function timeoutFail(name) {
      emitTestResult({'name':name,
                      'verdict':'fail',
                      'error':'timed out',
                      'args':[],
                      'stack':'',
                      'expected':'',
                      'obtainedResult':'Test timed out while awaiting completion.',
                      'status':'final'}, function() {});
    }

    /* Depending on the check value will be given by an emit, return, or
       emit-to-room, state is established for proper mocking/stubbing for the
       test, and the test is called.

       @param test: a dictionary of test state information
          test.func -- the function to be tested
          test.args -- an array of arguments to the function to be tested
          test.expected -- the value expected to receive either by emits or
                           return
          test.replyType -- how the check value will be obtained:
                            {return, emit, emit_to_room}

       @param getNextTest: a callback function to be passed along to the test
          analyzer that retrieves the next test to run.

       case 'return':
          call the function with test.args passed to the function and observe
          the returned value.
          analyze the return value for this test with testAnalyzer()

       case 'emit':
          swap the client's socket for a stubbed socket, saving the client's
          socket within the stubbed socket.
          set up a callback to the test analyzer and pass it as an argument to
          the function.
          call the function, relying on the subbed socket's emit() to analyze
          results with the callback
       case 'emit_to_room':
          swap the client socket with a stubbed socket.
          have the stubbed socket join the requested room
          set up a test analyzer callback as in case 'emit'
          apply the function
     */
    function testCaller(test, getNextTest) {
      if (test.replyType == 'return') { // testing return values
        var returnedValue = test.func.apply(null, test.args);
        testAnalyzer({'func': test.func,
                      'args': test.args,
                      'expected': test.expected,
                      'replyType': test.replyType,
                      'socket': socket,
                      'returnedValue': returnedValue,
                      'status': test.status},
                     getNextTest);
      }
      else if (test.replyType == 'emit') {
        var savedSocket = null;
        if (socket instanceof SocketStub) {
          savedSocket = socket.savedSocket;
        }
        else {
          var savedSocket = socket;
        }
        socket = new SocketStub({'func': test.func,
                                 'args': test.args,
                                 'expected': test.expected,
                                 'replyType': test.replyType,
                                 'socket': savedSocket,
                                 'status': test.status,
                                 'nextTest': getNextTest});
        socket.id = socket.savedSocket.id;
        if (io.sockets instanceof IOSocketsStub) {
          io.sockets.addSocket(socket);
        }
        var runAnalyzer = function() {
          testAnalyzer({'func': test.func,
                        'args': test.args,
                        'expected': test.expected,
                        'replyType': test.replyType,
                        'socket': savedSocket,
                        'status':test.status},
                       getNextTest);
        }
        test.args.push(runAnalyzer);
        test.func.apply(null, test.args);
      }
      else if (test.replyType == 'emit_to_room') {
        var savedSocket = null;
        if (socket instanceof SocketStub) {
          savedSocket = socket.savedSocket;
        }
        else {
          var savedSocket = socket;
        }
        socket = new SocketStub({'func': test.func,
                                 'args': test.args,
                                 'expected': test.expected,
                                 'replyType': test.replyType,
                                 'socket': savedSocket,
                                 'status': test.status,
                                 'nextTest': getNextTest});
        socket.id = socket.savedSocket.id;
        var room_id = test.join;
        socket.join(room_id);

        var runAnalyzer = function() {
          testAnalyzer({'func': test.func,
                        'args': test.args,
                        'expected': test.expected,
                        'replyType': test.replyType,
                        'socket': savedSocket,
                        'status': test.status},
                       getNextTest);
        }
        test.args.push(runAnalyzer);
        test.func.apply(null, test.args);
      }
      else if (test.replyType == 'database') {
        var runAnalyzer = function() {
          testAnalyzer({'func': test.func,
                        'args': test.args,
                        'expected': test.expected,
                        'replyType': test.replyType,
                        'status': test.status},
                       getNextTest);
        }
        db[test.expected.collection].find(test.expected.before.input,
                                          function(err, results) {
          if ((err == null) && (results.equals(test.expected.before.output))) {
            var testHook = {'location':test.expected.where,
                            'callback':runAnalyzer};
            test.args.push(testHook);
            test.func.apply(null, test.args);
          }
          else {
            emitTestResult({'name': test.func.name,
                            'verdict': 'fail',
                            'stack': 'Assure that you did not improperly ' +
                                     'seed/initialize database',
                            'argList': test.args,
                            'expected': test.expected.before.output,
                            'obtainedResult': results,
                            'status': test.status},
                           getNextTest);
          }
        });
      }

      function testAnalyzer(test, nextTest) {
          var getNextTest = nextTest;
          try {
            if (test.replyType == 'emit') {
              if (typeof socket.emitted == 'object' &&
                  typeof test.expected == 'object') {
                assert(socket.emitted.equals(test.expected));
              }
              else {
                assert(socket.emitted == test.expected);
              }
              emitTestResult({'name': test.func.name,
                              'verdict': 'pass',
                              'status': test.status},
                             getNextTest);
            }
            else if (test.replyType == 'emit_to_room') {
              if (typeof socket.emitted == 'object' &&
                  typeof test.expected == 'object') {
                assert(socket.emitted.equals(test.expected));
              }
              else {
                assert(socket.emitted == test.expected);
              }
              emitTestResult({'name': test.func.name,
                              'verdict': 'pass',
                              'status': test.status},
                             getNextTest);
            }
            else if (test.replyType == 'return') {
              if (typeof test.returnedValue == 'object' &&
                  typeof test.expected == 'object') {
                assert(test.returnedValue.equals(test.expected));
              }
              else {
                assert(test.returnedValue == test.expected);
              }
              emitTestResult({'name': test.func.name,
                              'verdict': 'pass',
                              'status': test.status},
                             getNextTest);
            }
            else if (test.replyType == 'database') {
              db[test.expected.collection].find(test.expected.after.input,
                                                function(err, results) {
                if ((err == null) && (results.equals(test.expected.after.output))) {
                  emitTestResult({'name': test.func.name,
                                  'verdict': 'pass',
                                  'status': test.status},
                                 getNextTest);
                }
                else {
                  emitTestResult({'name': test.func.name,
                                  'verdict': 'fail',
                                  'stack': 'Database output results were ' +
                                           'not what you expected',
                                  'argList': test.args,
                                  'expected': test.expected.after.output,
                                  'obtainedResult': results,
                                  'status': test.status},
                                 getNextTest);
                }
              });
            }
          }
          catch(err) {
            var actualValue = '';
            if ((test.replyType == 'emit') || (test.replyType == 'emit_to_room')) {
              actualValue = socket.emitted;
            }
            else if (test.replyType == 'database') {
              actualValue = '';
            }
            else {
              actualValue = test.returnedValue;
            }
            if (test.socket != undefined) {
              socket = test.socket;
            }
            emitTestResult({'name': test.func.name,
                            'verdict': 'fail',
                            'error': err,
                            'stack': err.stack,
                            'args': test.args,
                            'expected': test.expected,
                            'obtainedResult': actualValue,
                            'status':test.status},
                           getNextTest);
          }
        }

        /* A stubbed Socket, enabling inspection of emits */
        function SocketStub (input) {
          this.emitted = [];
          if (input != undefined) {
            this.func = input.func;
            this.args = input.args;
            this.expected = input.expected;
            this.replyType = input.replyType;
            this.savedSocket = input.socket;
            this.status = input.status;
            this.nextTest = input.nextTest;
          }
          this.emit = function() {
            for (var i = 0; i < arguments.length; i++) {
              this.emitted.push(arguments[i]);
            }
            testAnalyzer(input, this.nextTest);
          };
          this.join = function(roomID) {
            io.sockets.put(this, roomID);
          }
        }

        /* Stubs io.sockets, enabling stubbed calls to io.sockets.in,
           and io.sockets.socket(socketID)
         */
        function IOSocketsStub(rooms) {
          this.savedIOSockets = io.sockets;
          if (rooms == undefined) {
            this.rooms = new MockRooms();
          }
          else {
            this.rooms = new MockRooms(rooms);
          }
          this.sockets = {};
          this.in = function(roomID) {
            return this.rooms.getAllSocketsInRoom(roomID);
          }
          this.socket = function(id) {
            /*
            for (s in this.sockets) {
              if (s._id.equals(id)) {
                return s;
              }
            }
            */
            return this.sockets[id];
          }
          this.addSocket = function(socket) {
            this.sockets[socket.id] = socket;
          }
          this.put = function(socket, room) {
            this.rooms.put(socket, room);
            this.sockets[socket.id] = socket;
          }
        }

        /* Mocks a node.js room, enabling stubbed calls to
           io.sockets.in(roomID).emit(message)
         */
        function MockRoom(id) {
          this.sockets = [];
          this.quitReq = 0;
          this.members = this.sockets;
          this.emit = function(message, data) {
            var i = 0;
            for (i = 0; i < this.sockets.length; i++) {
              this.sockets[i].emit(message, data);
            }
          }
          this.put = function(socket) {
            this.sockets.push(socket);
          }
          this.addMember = function(member) {
            this.put(member);
          }
          this.getSockets = function() {
            return this.sockets;
          }
        }

        /* A mock object for node.js rooms, enabling operations
           like io.sockets.in(roomID).
         */
        function MockRooms(rooms) {
          if (rooms == undefined) {
            this.rooms = {};
          }
          else {
            this.rooms = rooms;
          }
          this.getAllSocketsInRoom = function(roomID) {
            return this.rooms[roomID];
          }
          this.put = function(socket, room) {
            if (this.rooms.room == undefined) {
              this.rooms[room] = new MockRoom();
            }
            this.rooms[room].put(socket);
          }
        }

        /* a .equals() implementation. handles nested equality with equalsHelper */
        Object.prototype.equals = function(x) {
          if (Object.prototype.toString.call(x) === '[object Array]') {
            if (Object.prototype.toString.call(this) === '[object Array]') {
              if (x.length != this.length) { return false; }
              // need to iterate through x and this in parallel
              var i;
              for (i = 0; i < x.length; i++) {
                if ((this[i] == null) && (x[i] == null)) { continue; }
                if (this[i] == null) { return false; }
                if (!this[i].equals(x[i])) {
                  return false;
                }
              }
              return true;
            }
            else { return false; }
          }
          else {
            return this.equalsHelper(x);
          }
        }

        Object.prototype.equalsHelper = function(x)
        {
          var thisHasID;
          var xHasID;
          var p;
          thisHasID = this['_id'] != undefined;
          xHasID = x['_id'] != undefined;
          thisHasTimeStamp = this['timestamp'] != undefined;
          xHasTimeStamp = x['timestamp'] != undefined;
          if (thisHasID && !xHasID) {
            x['_id'] = this['_id'];
          }
          if (thisHasTimeStamp && !xHasTimeStamp) {
            x['timestamp'] = this['timestamp'];
          }
          if (xHasID && !thisHasID) {
            this['_id'] = x['_id'];
          }
          if (!thisHasTimeStamp && xHasTimeStamp) {
            this['timestamp'] = x['timestamp'];
          }
          if (xHasID && thisHasID) {
            this['_id'] = x['_id'];
          }
          if (xHasTimeStamp && thisHasTimeStamp) {
            this['timestamp'] = x['timestamp'];
          }
          for(p in this) {
            if(typeof(x[p])=='undefined') {
              if  (typeof(this[p]) != 'undefined') {
                return false;
              }
            }
          }

          for(p in this) {
            if (this[p]) {
              switch(typeof(this[p])) {
              case 'object':
                if (!this[p].equals(x[p])) { return false; } break;
              case 'function':
                if (typeof(x[p])=='undefined' ||
                    (p != 'equals' && this[p].toString() != x[p].toString()))
                  return false;
                break;
              default:
                if (this[p] != x[p]) { return false; }
              }
            } else {
              if (x[p])
                return false;
            }
          }

          for(p in x) {
            if(typeof(this[p])=='undefined') {
              if (typeof(x[p]) != 'undefined') {
                return false;
              }
            }
          }

          return true;
        }

        // a dummy function for unit test framework functionlity testing
        function addOne(num) {
          var sum = num + 1;
          socket.emit(sum);
          return sum;
        }
      }
})
