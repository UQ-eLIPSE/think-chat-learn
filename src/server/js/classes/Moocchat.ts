declare type _UNKNOWN = any;

declare type errorThrowFunc = (e: Error) => void;
declare type nextFunc = () => void;
declare type callbackChainElem = (throwErr: errorThrowFunc, next: nextFunc) => void;

import {IServerConf} from "./conf/IServerConf";
import {IMoocchatIdentityInfo} from "./auth/IMoocchatIdentityInfo";

import * as crypto from "crypto";
import * as mongodb from "mongodb";
import * as SocketIO from "socket.io";

import {ServerConf} from "./conf/ServerConf";
import {Database} from "./data/Database";

import {ChatMessage} from "./data/models/ChatMessage";
import {User} from "./data/models/User";
import {UserSession} from "./data/models/UserSession";
import {QuizSchedule, IDB_QuizSchedule} from "./data/models/QuizSchedule";
import {Question, IDB_Question} from "./data/models/Question";
import {QuestionOption, IDB_QuestionOption} from "./data/models/QuestionOption";
import {QuestionResponse, IDB_QuestionResponse} from "./data/models/QuestionResponse";
import {Survey, IDB_Survey} from "./data/models/Survey";
import {SurveyResponse} from "./data/models/SurveyResponse";

import {ILTIData} from "./auth/lti/ILTIData";

// This set of imports comes from old websockets.ts file
// ====== START ======
import {PacSeqSocket_Server} from "../../../common/js/classes/PacSeqSocket_Server";

import {MoocchatUserSession} from "../models/MoocchatUserSession";
import {MoocchatWaitPool} from "../models/MoocchatWaitPool";
import {MoocchatChatGroup} from "../models/MoocchatChatGroup";
import {MoocchatBackupClientQueue} from "../models/MoocchatBackupClientQueue";

import {LTIProcessor} from "./auth/lti/LTIProcessor";
// ====== END ======



export class Moocchat {
    private socketIO: SocketIO.Server;
    private config: IServerConf;
    private db: mongodb.Db;

    constructor(config: IServerConf, socketIO: SocketIO.Server) {
        this.config = config;
        this.socketIO = socketIO;

        // TODO: This needs to be changed into something easier to read and manage for a sequence of callbacks
        this.setupDbConnection(this.setupMoocchat.bind(this));
    }

    private setupDbConnection(next?: Function) {
        Database.Connect(ServerConf.database, (err, db) => {
            if (err) {
                console.error(err.message);
                return;
            }

            this.db = db;

            if (next) {
                next();
            }
        });
    }

    private setupMoocchat() {
        const conf = ServerConf;

        const db_wrapper = {
            chatMessage: new ChatMessage(this.db),

            user: new User(this.db),
            userSession: new UserSession(this.db),

            quizSchedule: new QuizSchedule(this.db),

            question: new Question(this.db),
            questionOption: new QuestionOption(this.db),
            questionResponse: new QuestionResponse(this.db),

            survey: new Survey(this.db),
            surveyResponse: new SurveyResponse(this.db),
        }

        // LTI processor for incoming logins
        var ltiProcessor = new LTIProcessor(conf.lti.signingInfo);
        ltiProcessor.setTestMode(conf.lti.testMode);

        // ===== Chat group =====


        // Recurring task
        var chatGroupFormationLoop = (function() {
            var timeBetweenChecks = conf.chat.groups.formationIntervalMs;
            var timeoutHandles: {[poolQuizSessionId: string]: NodeJS.Timer} = {};

            /**
             * Runs another round of the loop, or starts the loop if not already active.
             * 
             * @param {MoocchatWaitPool} waitPool
             */
            function run(waitPool: MoocchatWaitPool) {
                clearTimeout(timeoutHandles[waitPool.getQuizSessionId()]);

                var sessionsInGroup = waitPool.tryFormGroup();

                if (sessionsInGroup && sessionsInGroup.length > 0) {
                    // Form chat group
                    var newChatGroup = new MoocchatChatGroup(sessionsInGroup);

                    // Record
                    newChatGroup.getSessions().forEach((session) => {
                        db_wrapper.userSession.updateOne(
                            {
                                _id: new Database.ObjectId(session.getId())
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
        function handleChatGroupJoinRequest(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted chat group join request with invalid session ID = " + data.sessionId);
            }

            // Can't join into pool if already in chat group
            if (session.chatGroup) {
                return console.error(`Attempted chat group join request with session already in chat group; session ID = ${session.getId()}`);
            }

            var waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(session);

            // Can't join into pool if already in pool
            if (waitPool.hasSession(session)) {
                return console.error(`Attempted chat group join request with session already in pool; session ID = ${session.getId()}`);
            }

            waitPool.addSession(session);

            broadcastPoolCountToBackupQueue__WaitPool(waitPool);
            chatGroupFormationLoop.run(waitPool);
        }

        /**
         * data = {
         *      groupId {string}
         *      sessionId {string}
         *      isTyping {boolean}
         * }
         * 
         * @param {any} data
         */
        function handleChatGroupTypingNotification(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted chat group typing notification with invalid session ID = " + data.sessionId);
            }

            var chatGroup = session.chatGroup;

            if (!chatGroup) {
                return console.error("Could not find chat group for session ID = " + data.sessionId);
            }

            chatGroup.setTypingState(session, data.isTyping);
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
        function handleChatGroupQuitStatusChange(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted chat group quit request with invalid session ID = " + data.sessionId);
            }

            var chatGroup = session.chatGroup;

            if (!chatGroup) {
                return console.error("Could not find chat group for session ID = " + data.sessionId);
            }

            if (data.quitStatus) {
                chatGroup.quitSession(session);
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
        function handleChatGroupMessage(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted chat group message from invalid session ID = " + data.sessionId);
            }

            var chatGroup = session.chatGroup;

            if (!chatGroup) {
                return console.error("Could not find chat group for session ID = " + data.sessionId);
            }

            db_wrapper.chatMessage.insertOne({
                content: data.message,
                sessionId: new Database.ObjectId(session.getId()),
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
        function handleLoginLti(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            function notifyClientOnError(err: Error) {
                // Reply direct to the user that sent the request as at this point no session is available
                socket.emit("loginFailure", (err && err.message) ? err.message : "Unexpected error");
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
                    writeSessionToDb,
                    notifyClientOfLogin
                ]);


            // Callback chain and synchronisation
            function runCallbackChain(errorThrowFunc: errorThrowFunc, callbackChain: callbackChainElem[]) {
                var chainIndex = -1;
                var errorThrown = false;

                var throwErr = function(err: Error) {
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

            function callbackSyncFactory(n: number, done: () => void) {
                return function() {
                    if (--n === 0) {
                        done();
                    }
                }
            }




            // Variables in serialised callback chain

            /** {ILTIData} */
            var ltiObject: ILTIData;

            /** {string} */
            var ltiUsername: string;

            /** {Mongo.ObjectId()} */
            var userObjectId: mongodb.ObjectID;

            /** {IDB_QuizSchedule} */
            var quizSchedule: IDB_QuizSchedule;

            /** {IDB_Question} */
            var question: IDB_Question;

            /** {IDB_QuestionOption[]} */
            var questionOptions: IDB_QuestionOption[];

            /** {IDB_Survey} */
            var survey: IDB_Survey;

            /** {Client} */
            // var client;

            /** {MoocchatUserSession} */
            var session: MoocchatUserSession;

            /** {boolean} */
            var researchConsentUnknown: boolean;

            function processLtiObject(throwErr: errorThrowFunc, next: nextFunc) {
                try {
                    ltiObject = ltiProcessor.verifyAndReturnLTIObj(data);
                } catch (e) {
                    return throwErr(e);
                }

                next();
            }

            function checkUserId(throwErr: errorThrowFunc, next: nextFunc) {
                ltiUsername = ltiObject.user_id;

                if (!ltiUsername) {
                    return throwErr(new Error("[10] No user ID received."));
                }

                next();
            }

            function retrieveUserId(throwErr: errorThrowFunc, next: nextFunc) {
                db_wrapper.user.readAsArray({ username: ltiUsername }, function(err, result) {
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

                        db_wrapper.user.insertOne({
                            _id: new Database.ObjectId(crypto.randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
                            username: ltiUsername,

                            firstName: ltiFirstName,
                            lastName: ltiLastName,

                            researchConsent: null
                        }, function(err, result) {
                            if (err) {
                                return throwErr(err);
                            }

                            userObjectId = result.insertedId;
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

            function checkNoActiveSession(throwErr: errorThrowFunc, next: nextFunc) {
                var session = MoocchatUserSession.GetSessionWith(userObjectId.toString());

                if (session) {
                    return throwErr(new Error("[20] The user '" + ltiUsername + "' is currently in an active session."));
                }

                next();
            }

            function findScheduledQuiz(throwErr: errorThrowFunc, next: nextFunc) {
                var now = new Date();

                db_wrapper.quizSchedule.readAsArray({
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

            function checkQuizSessionNotTaken(throwErr: errorThrowFunc, next: nextFunc) {
                // A session is considered to have been taken if a user
                // successfully fills in an initial AND final answer response
                // for this quiz session
                db_wrapper.userSession.readAsArray({
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

            function loadQuestionData(throwErr: errorThrowFunc, next: nextFunc) {
                // Sync on n = 2 (question + question options)
                var callbackSync = callbackSyncFactory(2, next);

                db_wrapper.question.readAsArray({
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

                db_wrapper.questionOption.readAsArray({
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

            function findSurvey(throwErr: errorThrowFunc, next: nextFunc) {
                var now = new Date();

                db_wrapper.survey.readAsArray({
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

            function writeSessionToDb(throwErr: errorThrowFunc, next: nextFunc) {
                db_wrapper.userSession.insertOne({
                    _id: new Database.ObjectId(crypto.randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
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

                    var sessionIdString = result.insertedId.toHexString();

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

            function notifyClientOfLogin(throwErr: errorThrowFunc, next: nextFunc) {
                // Complete login by notifying client
                session.getSocket().emit('loginSuccess', {
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

        function handleLogout(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted logout with invalid session ID = " + data.sessionId);
            }

            var sessionId = session.getId();

            db_wrapper.userSession.updateOne(
                {
                    _id: new Database.ObjectId(sessionId)
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

                    session.getSocket().emit("logoutSuccess", {
                        sessionId: sessionId
                    });

                    // Destroy session
                    MoocchatUserSession.Destroy(session);
                });
        }

        function handleTerminateSessions(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var username = data.username;

            if (!username || typeof username !== "string") {
                return;
            }

            db_wrapper.user.readAsArray(
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

                    var session: MoocchatUserSession;
                    while (session = MoocchatUserSession.GetSessionWith(userIdString)) {
                        MoocchatUserSession.Destroy(session, true);
                    }

                    // Reply direct to the user that sent the request as at this point no session is available
                    socket.emit("terminateSessionsComplete");
                });
        }

        function handleResearchConsentSet(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted research consent set with invalid session ID = " + data.sessionId);
            }

            var researchConsent = data.researchConsent;

            if (!(researchConsent === false || researchConsent === true)) {
                return;
            }

            db_wrapper.user.updateOne(
                {
                    _id: new Database.ObjectId(session.getUserId())
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

                    session.getSocket().emit("researchConsentSaved");
                });
        }

        // ===== Student client pool =====

        function broadcastPoolCountToBackupQueue__WaitPool(waitPool: MoocchatWaitPool) {
            var quizSessionId = waitPool.getQuizSessionId();

            var backupClientQueue = MoocchatBackupClientQueue.GetQueue(quizSessionId);

            backupClientQueue.broadcast("clientPoolCountUpdate", {
                backupClientQueue: {
                    quizScheduleId: backupClientQueue.getQuizSessionId()
                },
                numberOfClients: waitPool.getSize()
            });
        }


        // ===== Question + answer =====

        function answerSubmissionHandlerFactory(answerType: "initial" | "final") {
            return function(data: _UNKNOWN, socket: PacSeqSocket_Server) {
                var session = MoocchatUserSession.GetSession(data.sessionId, socket);

                if (!session) {
                    return console.error("Attempted answer submission with invalid session ID = " + data.sessionId);
                }

                var optionIdString = data.optionId;
                var justification = data.justification;

                /** Holds reference to the answer object (depends on `answerType`) */
                var sessionAnswerObj: IDB_QuestionResponse;

                /** String for websocket event to be sent on success */
                var onSuccessWebsocketEvent: string;

                /** Function for generating the update set depending on `answerType` */
                var generateUpdateSet: (id: mongodb.ObjectID) => Object;

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

                // Check that it hasn't already been saved
                if (sessionAnswerObj &&
                    sessionAnswerObj._id) {
                    return;
                }

                db_wrapper.questionResponse.insertOne({
                    optionId: (optionIdString ? new Database.ObjectId(optionIdString) : null),
                    justification: justification,
                    timestamp: new Date()
                }, function(err, result) {
                    if (err) {
                        return console.error(err);
                    }

                    var questionResponseObjectId = result.insertedId;

                    // Sets the OBJECT that is being held in session.data.response.*
                    sessionAnswerObj._id = questionResponseObjectId;
                    sessionAnswerObj.optionId = new Database.ObjectId(optionIdString);
                    sessionAnswerObj.justification = justification;

                    db_wrapper.userSession.updateOne(
                        {
                            _id: new Database.ObjectId(session.getId())
                        },
                        {
                            $set: generateUpdateSet(questionResponseObjectId)
                        },
                        function(err, result) {
                            if (err) {
                                return console.error(err);
                            }

                            session.getSocket().emit(onSuccessWebsocketEvent);
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
        function saveSurvey(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted survey submission with invalid session ID = " + data.sessionId);
            }

            // If survey already saved, don't save another
            if (session.data.surveyTaken) {
                return;
            }

            session.data.surveyTaken = true;

            db_wrapper.surveyResponse.insertOne({
                sessionId: new Database.ObjectId(session.getId()),
                surveyId: session.data.survey._id,
                timestamp: new Date(),
                content: data.content
            });
        }





        // ===== Backup client =====

        /**
         * data = {
         *      sessionId {string}
         *      optionId {string}
         *      justification {string}
         * }
         */
        function handleBackupClientEnterQueue(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted backup client enter queue with invalid session ID = " + data.sessionId);
            }

            // Fake a database entry with question response data
            session.data.response.initial.optionId = new Database.ObjectId(data.optionId);
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
        function handleBackupClientReturnToQueue(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted backup client return to queue with invalid session ID = " + data.sessionId);
            }

            // If session already has answer then return to queue
            if (!(session.data.response.initial.optionId && session.data.response.initial.justification)) {
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
        function handleBackupClientStatusRequest(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted backup client status request with invalid session ID = " + data.sessionId);
            }

            var backupClientQueue = MoocchatBackupClientQueue.GetQueueWith(session);

            if (backupClientQueue) {
                backupClientQueue.broadcastQueueChange();

                var waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(session);

                if (waitPool) {
                    broadcastPoolCountToBackupQueue__WaitPool(waitPool);
                }
            }
        }




        function handleSessionSocketResync(data: _UNKNOWN, socket: PacSeqSocket_Server) {
            var session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted session socket resync with invalid session ID = " + data.sessionId);
            }
        }


        this.socketIO.sockets.on('connection', function(_socket) {
            console.log(`socket.io/${_socket.id} CONNECTION`);

            // Wrap socket with PacSeqSocket
            const socket = new PacSeqSocket_Server(_socket);
            socket.enableInboundLogging();
            socket.enableOutboundLogging();

            /// Registration of socket event handlers
            // var registerSocketEventWithLogging = registerSocketEventWithLoggingFactory(socket);

            /* On websocket disconnect */
            socket.on('disconnect', disconnect);

            /* Submission of answers and surveys */
            socket.on("answerSubmissionInitial", function(data: _UNKNOWN) { handleAnswerSubmissionInitial(data, socket); });
            socket.on("answerSubmissionFinal", function(data: _UNKNOWN) { handleAnswerSubmissionFinal(data, socket); });
            socket.on("submitSurvey", function(data: _UNKNOWN) { saveSurvey(data, socket); });

            /* Log ins */
            socket.on("loginLti", function(data: _UNKNOWN) { handleLoginLti(data, socket); });
            socket.on("researchConsentSet", function(data: _UNKNOWN) { handleResearchConsentSet(data, socket); });
            socket.on("logout", function(data: _UNKNOWN) { handleLogout(data, socket); });
            socket.on("terminateSessions", function(data: _UNKNOWN) { handleTerminateSessions(data, socket); });
            /* Chat group discussion */
            socket.on("chatGroupJoinRequest", function(data: _UNKNOWN) { handleChatGroupJoinRequest(data, socket); });
            socket.on("chatGroupMessage", function(data: _UNKNOWN) { handleChatGroupMessage(data, socket); });
            socket.on("chatGroupQuitStatusChange", function(data: _UNKNOWN) { handleChatGroupQuitStatusChange(data, socket); });
            socket.on("chatGroupTypingNotification", function(data: _UNKNOWN) { handleChatGroupTypingNotification(data, socket); });

            /* Backup client */
            // socket.on("backupClientLogout", function(data) { handleBackupClientLogout(data, socket); });
            socket.on("backupClientEnterQueue", function(data: _UNKNOWN) { handleBackupClientEnterQueue(data, socket); });
            socket.on("backupClientReturnToQueue", function(data: _UNKNOWN) { handleBackupClientReturnToQueue(data, socket); });
            socket.on("backupClientStatusRequest", function(data: _UNKNOWN) { handleBackupClientStatusRequest(data, socket); });



            socket.on("sessionSocketResync", function(data: _UNKNOWN) { handleSessionSocketResync(data, socket); });



            // No longer done here; see MoocchatBackupClientQueue#callToPool()
            // socket.on("backupClientTransferConfirm", function(data) { handleBackupClientTransferConfirm(data, socket); });

            /* Testing */
            // socket.on('loadTestReq', loadTest);
            // socket.on('saveLoadTestResults', saveLoadTestResults);

            // Signal back to client/test framework that socket is connected
            // socket.emit(socket, 'connected');




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
            }
        });

        console.log("All websocket events registered.");
    }
}