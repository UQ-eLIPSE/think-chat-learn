import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";


import * as mongodb from "mongodb";

import * as DBSchema from "../../../../common/interfaces/DBSchema";

import { User } from "../../user/User";
import { UserSession } from "../../user/UserSession";
import { SocketSession } from "../SocketSession";

import { QuizSchedule } from "../../quiz/QuizSchedule";
import { QuizAttempt } from "../../quiz/QuizAttempt";

import { Question } from "../../question/Question";
import { QuestionOption } from "../../question/QuestionOption";

import { Survey } from "../../survey/Survey";

import { ChatGroup } from "../../chat/ChatGroup";

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
        // TODO: Logins will be split from the actual "quiz attempt"; most of
        //         the below code is related more to quiz stuff than logins
        
        try {
            // Get user+quiz info, check validity
            const identity = await UserLoginFunc.ProcessLtiObject(data);
            UserLoginFunc.CheckUserId(identity);

            const user = await UserLoginFunc.RetrieveUser(db, identity);
            UserLoginFunc.CheckNoActiveSession(user);   // TODO: Need to change this to check live quiz attempts to the current quiz, not user session

            if (!identity.course) {
                throw new Error(`No course associated with identity`);
            }

            const quizSchedule = await UserLoginFunc.RetrieveQuizSchedule(db, identity.course);
            await UserLoginFunc.CheckQuizNotPreviouslyAttempted(db, user, quizSchedule);

            // ----- Passed checks at this point -----

            // Fetching content for quiz
            const question = quizSchedule.getQuestion();
            const questionOptions = await UserLoginFunc.RetrieveQuestionOptions(db, question);
            const survey: Survey | undefined = await UserLoginFunc.RetrieveSurvey(db, identity.course);

            // Setting up session
            const isAdmin = UserLoginFunc.DetermineAdminStatus(identity);
            const session = await UserLoginFunc.CreateSession(db, user, isAdmin, identity.course);
            SocketSession.Create(session).setSocket(socket);
            
            const quizAttempt = await UserLoginFunc.CreateQuizAttempt(db, quizSchedule, session);
            UserLoginFunc.SetupChatGroupFormationLoop(db, quizAttempt);

            // Return response
            UserLoginFunc.NotifyClientOfLogin(socket, session, user, quizSchedule, quizAttempt, question, questionOptions, survey);
        } catch (e) {
            UserLoginEndpoint.NotifyClientOnError(socket, e);
        }
    }

    private static async HandleLogout(socket: PacSeqSocket_Server, data: IWSToServerData.Logout, db: mongodb.Db) {
        const session = UserSession.Get(data.sessionId);

        if (!session) {
            return console.error("Attempted logout with invalid session ID = " + data.sessionId);
        }

        const sessionId = session.getId();

        // Log out by ending the session, then destroying the in-memory object
        await session.end();
        session.destroyInstance();

        socket.emitData<IWSToClientData.LogoutSuccess>("logoutSuccess", {
            sessionId,
        });
    }

    private static async HandleTerminateSessions(socket: PacSeqSocket_Server, data: IWSToServerData.TerminateSessions, db: mongodb.Db) {
        const username = data.username;

        if (!username || typeof username !== "string") {
            return console.error("Attempted terminate session with invalid username = " + username);
        }

        const user = await User.GetAutoFetch(db, username);

        if (!user) {
            return console.error("Attempted terminate session with username not in DB; username = " + username);
        }

        const userIdString = user.getId();
        console.log("Destroying all sessions with username '" + username + "'; user ID '" + userIdString + "'");

        // Kill all user sessions associated with user
        const userSessions = await UserSession.GetWith(user);
        userSessions.forEach(_ => _.destroyInstance());

        // Reply direct to the user that sent the request, as at this point no session is available
        socket.emit("terminateSessionsComplete");
    }

    private static async HandleResearchConsentSet(socket: PacSeqSocket_Server, data: IWSToServerData.LoginResearchConsent, db: mongodb.Db) {
        const session = UserSession.Get(data.sessionId);

        if (!session) {
            return console.error("Attempted research consent set with invalid session ID = " + data.sessionId);
        }

        const researchConsent = data.researchConsent;

        if (!(researchConsent === false || researchConsent === true)) {
            return console.error(`Session ${session.getId()} attempted research consent set with invalid value = ${researchConsent}`);
        }

        await session.getUser().setResearchConsent(researchConsent);

        socket.emit("researchConsentSaved");
    }

    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onLoginLti() {
        return (data: IWSToServerData.LoginLti) => {
            UserLoginEndpoint.HandleLoginLTI(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
        };
    }

    public get onLogout() {
        return (data: IWSToServerData.Logout) => {
            UserLoginEndpoint.HandleLogout(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
        };
    }

    public get onTerminateSessions() {
        return (data: IWSToServerData.TerminateSessions) => {
            UserLoginEndpoint.HandleTerminateSessions(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
        };
    }

    public get onResearchConsentSet() {
        return (data: IWSToServerData.LoginResearchConsent) => {
            UserLoginEndpoint.HandleResearchConsentSet(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
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

class UserLoginFunc {
    public static async ProcessLtiObject(loginData: IWSToServerData.LoginLti) {
        const ltiAuth = new LTIAuth(loginData);

        const authResult = ltiAuth.authenticate();

        if (!authResult.success) {
            throw new Error(authResult.message);
        }

        return ltiAuth.getIdentity();
    }

    public static CheckUserId(identity: IMoocchatIdentityInfo) {
        if (!identity.identityId) {
            throw new Error("[10] No user ID received.");
        }
    }

    public static async RetrieveUser(db: mongodb.Db, identity: IMoocchatIdentityInfo) {
        return await User.GetAutoFetchAutoCreate(db, identity);
    }

    public static CheckNoActiveSession(user: User) {
        const sessions = UserSession.GetWith(user);

        if (sessions.length > 0) {
            throw new Error(`[20] The user "${user.getUsername()}" is currently in an active session.`);
        }
    }

    public static async RetrieveQuizSchedule(db: mongodb.Db, course: string) {
        const quiz = await QuizSchedule.FetchActiveNow(db, course);

        if (!quiz) {
            throw new Error("[30] No scheduled quiz found.");
        }

        return quiz;
    }

    public static async CheckQuizNotPreviouslyAttempted(db: mongodb.Db, user: User, quizSchedule: QuizSchedule) {
        if (await QuizAttempt.HasPreviouslyCompleted(db, quizSchedule, user)) {
            throw new Error(`[21] User "${user.getUsername()}" has previously completed the current quiz session.`);
        }
    }

    public static async RetrieveQuestionOptions(db: mongodb.Db, question: Question) {
        const options = await QuestionOption.FetchWithQuestion(db, question);

        if (options.length === 0) {
            throw new Error(`[51] No question options for question ID = ${question.getId()}`);
        }

        return options;
    }

    public static async RetrieveSurvey(db: mongodb.Db, course: string) {
        return await Survey.FetchActiveNow(db, course);
    }

    public static DetermineAdminStatus(identity: IMoocchatIdentityInfo) {
        const adminRoles = [
            "instructor",
            "teachingassistant",
            "administrator",
        ];

        const isAdmin = (identity.roles || []).some(role => {
            return Utils.Array.includes(adminRoles, role.toLowerCase());
        });

        return isAdmin;
    }

    public static async CreateSession(db: mongodb.Db, user: User, isAdmin: boolean, course: string) {
        let sessionType: DBSchema.UserSessionType;

        if (isAdmin) {
            sessionType = "ADMIN";
        } else {
            sessionType = "STUDENT";
        }

        return await UserSession.Create(db, user, sessionType, course);
    }

    public static async CreateQuizAttempt(db: mongodb.Db, quizSchedule: QuizSchedule, session: UserSession) {
        return await QuizAttempt.Create(db, session, quizSchedule);
    }

    public static SetupChatGroupFormationLoop(db: mongodb.Db, quizAttempt: QuizAttempt) {
        const quizSchedule = quizAttempt.getQuizSchedule();
        const quizSessionId = quizSchedule.getId();
        const loop = ChatGroupFormationLoop.GetChatGroupFormationLoopWithQuizScheduleFrom(quizAttempt);

        if (!loop.hasStarted) {
            loop.registerOnGroupCoalesced((quizAttempts) => {
                // Form chat group out of coalesced quiz attempts
                console.log(`Forming chat group with quiz attempts: ${quizAttempts.map(_ => _.getId()).join()}`)
                ChatGroup.Create(db, {}, quizSchedule, quizAttempts);
                
                console.log(`Updating backup queue`);
                const backupClientQueue = MoocchatBackupClientQueue.GetQueue(quizSessionId);
                backupClientQueue.broadcastWaitPoolCount();
            });

            loop.start();
        }
    }

    public static NotifyClientOfLogin(socket: PacSeqSocket_Server, session: UserSession, user: User, quizSchedule: QuizSchedule, quizAttempt: QuizAttempt, question: Question, questionOptions: QuestionOption[], survey: Survey | undefined) {
        const researchConsent = user.getResearchConsent();

        let researchConsentRequired: boolean;

        // If previously explicitly set, consent not required
        if (researchConsent === false || researchConsent === true) {
            researchConsentRequired = false;
        } else {
            researchConsentRequired = true;
        }

        // Complete login by notifying client
        const quizScheduleData = quizSchedule.getData() as DBSchema.QuizSchedule<string, string>;
        const questionData = question.getData() as DBSchema.Question<string>;
        const questionOptionsData = questionOptions.map(questionOption => questionOption.getData()) as DBSchema.QuestionOption<string>[];
        const surveyData = survey ? survey.getData() as DBSchema.Survey<string, string> : null;

        socket.emitData<IWSToClientData.LoginSuccess>("loginSuccess", {
            sessionId: session.getId(),
            quizAttemptId: quizAttempt.getId(),
            username: user.getUsername()!,
            quiz: {
                quizSchedule: quizScheduleData,
                question: questionData,
                questionOptions: questionOptionsData,
            },
            survey: surveyData,
            researchConsentRequired,
        });
    }

}