import {WSEndpoint} from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import {PacSeqSocket_Server} from "../../../../common/js/PacSeqSocket_Server";

import * as crypto from "crypto";

import * as mongodb from "mongodb";
import {Database} from "../../data/Database";
import {User, IDB_User} from "../../data/models/User";
import {UserSession} from "../../data/models/UserSession";
import {QuizSchedule, IDB_QuizSchedule} from "../../data/models/QuizSchedule";
import {Question, IDB_Question} from "../../data/models/Question";
import {QuestionOption, IDB_QuestionOption} from "../../data/models/QuestionOption";
import {Survey, IDB_Survey} from "../../data/models/Survey";

import * as CBC from "../../../../common/js/CallbackChainer";
import {CountingSynchroniser} from "../../../../common/js/CountingSynchroniser";

import {MoocchatUserSession} from "../../user/MoocchatUserSession";
import {ChatGroupFormationLoop} from "../../chat/ChatGroupFormationLoop";
import {MoocchatBackupClientQueue} from "../../queue/MoocchatBackupClientQueue";

import {LTIAuth} from "../../auth/lti/LTIAuth";
import {IMoocchatIdentityInfo} from "../../auth/IMOOCchatIdentityInfo";


export class UserLoginEndpoint extends WSEndpoint {
    private static NotifyClientOnError(socket: PacSeqSocket_Server, e: Error) {
        socket.emit("loginFailure", (e && e.message) ? e.message : "Unexpected error");
    }

    private static HandleLoginLTI(socket: PacSeqSocket_Server, data: IWSToServerData.LoginLti, db: mongodb.Db) {
        const dbUser = new User(db);
        const dbUserSession = new UserSession(db);
        const dbQuizSchedule = new QuizSchedule(db);

        const dbQuestion = new Question(db);
        const dbQuestionOption = new QuestionOption(db);

        const dbSurvey = new Survey(db);


        // Callback chain
        // TODO: Seriously need to convert this into Promises for better structure,
        //       streamlined execution and more reliable error handling
        new CBC.CallbackChainer([
            processLtiObject,
            checkUserId,
            retrieveUser,
            checkNoActiveSession,
            findScheduledQuiz,
            checkQuizSessionNotTaken,
            loadQuestionData,
            findSurvey,
            writeSessionToDb,
            setupChatGroupFormationLoop,
            notifyClientOfLogin
        ]).run((e) => {
            UserLoginEndpoint.NotifyClientOnError(socket, e);
        });


        // Variables in serialised callback chain
        let identity: IMoocchatIdentityInfo;
        let session: MoocchatUserSession;
        let user: IDB_User;

        let quizSchedule: IDB_QuizSchedule;
        let question: IDB_Question;
        let questionOptions: IDB_QuestionOption[];
        let survey: IDB_Survey;

        function processLtiObject(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            const ltiAuth = new LTIAuth(data);

            const authResult = ltiAuth.authenticate();

            if (!authResult.result) {
                return throwErr(new Error(authResult.message));
            }

            identity = ltiAuth.getIdentity();

            next();
        }

        function checkUserId(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            if (!identity.identityId) {
                return throwErr(new Error("[10] No user ID received."));
            }

            next();
        }

        function retrieveUser(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            dbUser.readAsArray({
                username: identity.identityId
            }, function(err, result) {
                if (err) {
                    return throwErr(err);
                }

                if (result.length > 1) {
                    return throwErr(new Error("[11] More than one user with same username '" + identity.identityId + "' detected."));
                }

                // New user
                if (result.length === 0) {
                    const newUser: IDB_User = {
                        _id: new Database.ObjectId(crypto.randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
                        username: identity.identityId,

                        firstName: identity.name.given,
                        lastName: identity.name.family,

                        researchConsent: null
                    };

                    dbUser.insertOne(newUser,
                        function(err, result) {
                            if (err) {
                                return throwErr(err);
                            }

                            user = newUser;

                            next();
                        });

                    return;
                }

                // Existing user
                user = result[0];

                next();
            });
        }

        function checkNoActiveSession(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            const session = MoocchatUserSession.GetSessionWith(user._id.toHexString());

            if (session) {
                return throwErr(new Error("[20] The user '" + identity.identityId + "' is currently in an active session."));
            }

            next();
        }

        function findScheduledQuiz(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            const now = new Date();

            dbQuizSchedule.readAsArray({
                availableStart: { $lte: now },
                availableEnd: { $gte: now }
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

        function checkQuizSessionNotTaken(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            // A session is considered to have been taken if a user
            // successfully fills in an initial AND final answer response
            // for this quiz session
            dbUserSession.readAsArray({
                userId: user._id,
                quizScheduleId: quizSchedule._id,
                responseInitialId: { $ne: null },
                responseFinalId: { $ne: null }
            }, function(err, result) {
                if (err) {
                    return throwErr(err);
                }

                if (result.length > 0) {
                    return throwErr(new Error("[21] User '" + identity.identityId + "' has previously completed the current quiz session."));
                }

                next();
            });
        }

        function loadQuestionData(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            // Sync on n = 2 (question + question options)
            const callbackSync = new CountingSynchroniser(2, next).generateSyncFunction();

            dbQuestion.readAsArray({
                _id: quizSchedule.questionId
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

            dbQuestionOption.readAsArray({
                questionId: quizSchedule.questionId
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

        function findSurvey(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            const now = new Date();

            dbSurvey.readAsArray({
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

        function writeSessionToDb(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            dbUserSession.insertOne({
                _id: new Database.ObjectId(crypto.randomBytes(12).toString('hex')),   // MongoDB ObjectIDs are 12 bytes only!
                userId: user._id,

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

                const sessionIdString = result.insertedId.toHexString();

                // Set up session
                session = new MoocchatUserSession(socket, user._id.toHexString(), sessionIdString);
                session.initSessionData(
                    quizSchedule,
                    question,
                    questionOptions,
                    survey,
                    identity.identityId
                );

                next();
            });
        }

        function setupChatGroupFormationLoop(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            const quizSessionId = session.data.quizSchedule._id.toHexString();
            const loop = ChatGroupFormationLoop.GetChatGroupFormationLoopWithQuizScheduleFrom(session);

            if (!loop.hasStarted) {
                loop.registerOnSessionAssignedChatGroup((newChatGroup, session) => {
                    console.log(`Writing chat group ${newChatGroup.getId()} to user session ${session.getId()}`);
                    dbUserSession.updateOne(
                        {
                            _id: new Database.ObjectId(session.getId())
                        },
                        {
                            $set: {
                                chatGroupId: newChatGroup.getId()
                            }
                        });
                });

                loop.registerOnChatGroupFormed((newChatGroup) => {
                    console.log(`Updating backup queue`);
                    const backupClientQueue = MoocchatBackupClientQueue.GetQueue(quizSessionId);
                    backupClientQueue.broadcastWaitPoolCount();
                });

                loop.start();
            }

            next();
        }

        function notifyClientOfLogin(throwErr: CBC.ErrorThrowFunc, next: CBC.NextFunc) {
            // Complete login by notifying client
            session.getSocket().emit("loginSuccess", {
                sessionId: session.getId(),
                username: identity.identityId,
                quiz: {
                    quizSchedule: quizSchedule,
                    question: question,
                    questionOptions: questionOptions
                },
                survey: survey,
                researchConsentRequired: (user.researchConsent === false || user.researchConsent === true) ? false : true
            });

            next();
        }
    }

    private static HandleLogout(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupJoin, db: mongodb.Db) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted logout with invalid session ID = " + data.sessionId);
        }

        const sessionId = session.getId();

        new UserSession(db).updateOne(
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

                session.getSocket().emitData<IWSToClientData.LogoutSuccess>("logoutSuccess", {
                    sessionId: sessionId
                });

                // Destroy session
                MoocchatUserSession.Destroy(session);
            });
    }

    private static HandleTerminateSessions(socket: PacSeqSocket_Server, data: IWSToServerData.TerminateSessions, db: mongodb.Db) {
        const username = data.username;

        if (!username || typeof username !== "string") {
            return console.error("Attempted terminate session with invalid username = " + username);
        }

        new User(db).readAsArray(
            {
                username: username
            },
            function(err, result) {
                if (err) {
                    return;
                }

                if (result.length === 0) {
                    return console.error("Attempted terminate session with username not in DB; username = " + username);
                }

                const user = result[0];
                const userIdString = user._id.toHexString();

                console.log("Destroying all sessions with username '" + username + "'; user ID '" + userIdString + "'");

                let session: MoocchatUserSession;
                while (session = MoocchatUserSession.GetSessionWith(userIdString)) {
                    MoocchatUserSession.Destroy(session, true);
                }

                // Reply direct to the user that sent the request, as at this point no session is available
                socket.emit("terminateSessionsComplete");
            });
    }

    private static HandleResearchConsentSet(socket: PacSeqSocket_Server, data: IWSToServerData.LoginResearchConsent, db: mongodb.Db) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted research consent set with invalid session ID = " + data.sessionId);
        }

        const researchConsent = data.researchConsent;

        if (!(researchConsent === false || researchConsent === true)) {
            return console.error(`Session ${session.getId()} attempted research consent set with invalid value = ${researchConsent}`);
        }

        new User(db).updateOne(
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



    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onLoginLti() {
        return (data: IWSToServerData.LoginLti) => {
            UserLoginEndpoint.HandleLoginLTI(this.getSocket(), data, this.db);
        };
    }

    public get onLogout() {
        return (data: IWSToServerData.Logout) => {
            UserLoginEndpoint.HandleLogout(this.getSocket(), data, this.db);
        };
    }

    public get onTerminateSessions() {
        return (data: IWSToServerData.TerminateSessions) => {
            UserLoginEndpoint.HandleTerminateSessions(this.getSocket(), data, this.db);
        };
    }

    public get onResearchConsentSet() {
        return (data: IWSToServerData.LoginResearchConsent) => {
            UserLoginEndpoint.HandleResearchConsentSet(this.getSocket(), data, this.db);
        };
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "loginLti": return this.onLoginLti;
            case "logout": return this.onLogout;
            case "terminateSessions": return this.onTerminateSessions;
            case "researchConsentSet": return this.onResearchConsentSet;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "loginLti",
            "logout",
            "terminateSessions",
            "researchConsentSet",
        ]);
    }
}