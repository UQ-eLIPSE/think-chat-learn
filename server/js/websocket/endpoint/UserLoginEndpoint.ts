import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";


import * as mongodb from "mongodb";
import { Database } from "../../data/Database";

import * as DBSchema from "../../../../common/interfaces/DBSchema";

import { User } from "../../user/User";
import { UserSession } from "../../user/UserSession";

import { QuizSchedule } from "../../quiz/QuizSchedule";
import { QuizAttempt } from "../../quiz/QuizAttempt";

import { Question } from "../../question/Question";
import { QuestionOption } from "../../question/QuestionOption";

import { Survey } from "../../survey/Survey";


import { ChatGroupFormationLoop } from "../../chat/ChatGroupFormationLoop";
import { MoocchatBackupClientQueue } from "../../queue/MoocchatBackupClientQueue";

import { LTIAuth } from "../../auth/lti/LTIAuth";
import { IMoocchatIdentityInfo } from "../../auth/IMoocchatIdentityInfo";

import { Utils } from "../../../../common/js/Utils";


export class UserLoginEndpoint extends WSEndpoint {
    private static NotifyClientOnError(socket: PacSeqSocket_Server, e: Error) {
        socket.emit("loginFailure", (e && e.message) ? e.message : "Unexpected error");
    }

    private static async HandleLoginLTI(socket: PacSeqSocket_Server, data: IWSToServerData.LoginLti, db: mongodb.Db) {
        const processLtiObject = async (loginData: IWSToServerData.LoginLti) => {
            const ltiAuth = new LTIAuth(loginData);

            const authResult = ltiAuth.authenticate();

            if (!authResult.success) {
                throw new Error(authResult.message);
            }

            return ltiAuth.getIdentity();
        }

        const checkUserId = (identity: IMoocchatIdentityInfo) => {
            if (!identity.identityId) {
                throw new Error("[10] No user ID received.");
            }
        }

        const retrieveUser = async (identity: IMoocchatIdentityInfo) => {
            return await User.GetAutoFetchAutoCreate(db, identity);
        }

        const checkNoActiveSession = (user: User) => {
            const sessions = UserSession.GetWith(user);

            if (sessions.length > 0) {
                throw new Error(`[20] The user "${user.getUsername()}" is currently in an active session.`);
            }
        }

        const retrieveQuizSchedule = async (course: string) => {
            const quiz = await QuizSchedule.FetchActiveNow(db, course);

            if (!quiz) {
                throw new Error("[30] No scheduled quiz found.");
            }

            return quiz;
        }

        const checkQuizNotPreviouslyAttempted = async (user: User, quizSchedule: QuizSchedule) => {
            if (await QuizAttempt.HasPreviouslyCompleted(db, quizSchedule, user)) {
                throw new Error(`[21] User "${user.getUsername()}" has previously completed the current quiz session.`);
            }
        }

        const retrieveQuestionOptions = async (question: Question) => {
            const options = await QuestionOption.FetchWithQuestion(db, question);

            if (options.length === 0) {
                throw new Error(`[51] No question options for question ID = ${question.getId()}`);
            }

            return options;
        }

        const retrieveSurvey = async (course: string) => {
            return await Survey.FetchActiveNow(db, course);
        }

        const determineAdminStatus = (identity: IMoocchatIdentityInfo) => {
            const adminRoles = [
                "instructor",
                "teachingassistant",
                "administrator",
            ];

            const isAdmin = identity.roles.some(role => {
                return Utils.Array.includes(adminRoles, role.toLowerCase());
            });

            return isAdmin;
        }

        const createSession = async (user: User, isAdmin: boolean) => {
            let sessionType: DBSchema.UserSessionType;

            if (isAdmin) {
                sessionType = "ADMIN";
            } else {
                sessionType = "STUDENT";
            }

            return await UserSession.Create(db, user, sessionType);
        }

        const createQuizAttempt = async (quizSchedule: QuizSchedule, session: UserSession) => {
            return await QuizAttempt.Create(db, session, quizSchedule);
        }

        const setupChatGroupFormationLoop = async (quizAttempt: QuizAttempt) => {
            const quizSessionId = quizAttempt.getQuizSchedule().getId();
            const loop = ChatGroupFormationLoop.GetChatGroupFormationLoopWithQuizScheduleFrom(quizAttempt);

            if (!loop.hasStarted) {
                loop.registerOnSessionAssignedChatGroup((newChatGroup, quizAttempt) => {




                    // TODO: ChatGroup model should already handle saving the chat groups into DB!



                    // console.log(`Writing chat group ${newChatGroup.getId()} to user session ${quizAttempt.getId()}`);
                    // dbUserSession.updateOne(
                    //     {
                    //         _id: new Database.ObjectId(quizAttempt.getId())
                    //     },
                    //     {
                    //         $set: {
                    //             chatGroupId: newChatGroup.getId()
                    //         }
                    //     });







                });

                loop.registerOnChatGroupFormed((newChatGroup) => {
                    console.log(`Updating backup queue`);
                    const backupClientQueue = MoocchatBackupClientQueue.GetQueue(quizSessionId);
                    backupClientQueue.broadcastWaitPoolCount();
                });

                loop.start();
            }

            const notifyClientOfLogin = (session: UserSession, user: User, quizSchedule: QuizSchedule, question: Question, questionOptions: QuestionOption[], survey: Survey | undefined) => {
                const researchConsent = user.getResearchConsent();

                let researchConsentRequired: boolean;

                // If previously explicitly set, consent not required
                if (researchConsent === false || researchConsent === true) {
                    researchConsentRequired = false;
                } else {
                    researchConsentRequired = true;
                }

                // Complete login by notifying client
                socket.emit("loginSuccess", {
                    sessionId: session.getId(),
                    username: user.getUsername(),
                    quiz: {
                        quizSchedule: quizSchedule.getData(),
                        question: question.getData(),
                        questionOptions: questionOptions.map(questionOption => questionOption.getData())
                    },
                    survey: survey ? survey.getData() : null,
                    researchConsentRequired,
                });
            }

            try {
                const identity = await processLtiObject(data);
                checkUserId(identity);

                const user = await retrieveUser(identity);
                checkNoActiveSession(user);

                const quizSchedule = await retrieveQuizSchedule(identity.course);
                checkQuizNotPreviouslyAttempted(user, quizSchedule);

                const question = quizSchedule.getQuestion();

                const questionOptions = await retrieveQuestionOptions(question);

                const survey: Survey | undefined = await retrieveSurvey(identity.course);

                const isAdmin = determineAdminStatus(identity);

                const session = await createSession(user, isAdmin);

                const quizAttempt = await createQuizAttempt(quizSchedule, session);

                setupChatGroupFormationLoop(quizAttempt);

                notifyClientOfLogin(session, user, quizSchedule, question, questionOptions, survey);
            } catch (e) {
                UserLoginEndpoint.NotifyClientOnError(socket, e);
            }
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