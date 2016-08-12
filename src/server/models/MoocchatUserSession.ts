import {MoocchatUserSessionData} from "./MoocchatUserSessionData";
import {MoocchatUserSessionStore} from "./MoocchatUserSessionStore";

import {MoocchatWaitPool} from "./MoocchatWaitPool";
import {MoocchatChatGroup} from "./MoocchatChatGroup";
import {MoocchatBackupClientQueue} from "./MoocchatBackupClientQueue";

import {IDB_Question} from "./database/Question";
import {IDB_QuestionOption} from "./database/QuestionOption";
import {IDB_QuizSchedule} from "./database/QuizSchedule";
import {IDB_Survey} from "./database/Survey";

import {PacSeqSocket_Server} from "../../common/js/classes/PacSeqSocket_Server";

export class MoocchatUserSession {
    private static UserSessionStore: MoocchatUserSessionStore = new MoocchatUserSessionStore();

    private _userId: string;
    private _sessionId: string;
    private _userSessionData: MoocchatUserSessionData;
    private _socket: PacSeqSocket_Server;



    public static GetSessionIds() {
        return MoocchatUserSession.UserSessionStore.getSessionIds();
    }

    public static GetSession(sessionId: string, socket?: PacSeqSocket_Server) {
        const session = MoocchatUserSession.UserSessionStore.getSession(sessionId);

        if (session && socket && socket !== session.getSocket()) {
            // Update socket reference in case someone has switched/disconnected-connected sockets
            const oldSocket = session.getSocket();
            const newSocket = socket;

            // Force move the session
            PacSeqSocket_Server.Copy(oldSocket, newSocket);
            PacSeqSocket_Server.Destroy(oldSocket);
            session.setSocket(socket);
        }

        return session;
    }

    public static GetSessionWith(userId: string) {
        return MoocchatUserSession.UserSessionStore.getSessionByUserId(userId);
    }

    public static Destroy(session: MoocchatUserSession, sendTerminateMessage: boolean = false) {
        const sessionId = session.getId();

        // Remove session from other objects
        var waitPool = MoocchatWaitPool.GetPoolWith(session);

        if (waitPool) {
            waitPool.removeSession(session);
        }

        var chatGroup = MoocchatChatGroup.GetChatGroupWith(session);

        if (chatGroup) {
            chatGroup.quitSession(session);
        }

        var backupClientQueue = MoocchatBackupClientQueue.GetQueueWith(session);

        if (backupClientQueue) {
            backupClientQueue.removeSession(session);
        }



        // Wipe user session info - this must be done *AFTER* all other clean ups in other objects
        session._userSessionData = undefined;
        session.setId(undefined);
        session.setUserId(undefined);

        if (session.getSocket()) {
            if (sendTerminateMessage) {
                session.getSocket().emit("terminated");
            }

            // Give a little bit of time before disconnecting
            setTimeout(() => {
                session.getSocket().disconnect(true);
            }, 500);
        }

        session.removeFromStore();

        console.log(`Session '${sessionId}' destroyed`);
    }



    constructor(socket: PacSeqSocket_Server, userId: string, sessionId: string) {
        this.setSocket(socket);
        this.setUserId(userId);
        this.setId(sessionId);
        this.addToStore();

        console.log(`Session '${this.getId()}' created; User = ${this.getUserId()}`);
    }

    public get data() {
        return this._userSessionData;
    }

    /**
     * Must be run prior to using this.data
     */
    public initSessionData(
        quizSchedule: IDB_QuizSchedule,
        quizQuestion: IDB_Question,
        quizQuestionOptions: IDB_QuestionOption[],
        survey: IDB_Survey,
        username: string) {

        this._userSessionData = new MoocchatUserSessionData(
            quizSchedule,
            quizQuestion,
            quizQuestionOptions,
            survey,
            username
        );
    }

    private setUserId(userId: string) {
        this._userId = userId;
    }

    public getUserId() {
        return this._userId;
    }

    private setId(sessionId: string) {
        this._sessionId = sessionId;
    }

    public getId() {
        return this._sessionId;
    }

    private setSocket(socket: PacSeqSocket_Server) {
        this._socket = socket;
    }

    public getSocket() {
        return this._socket;
    }

    private addToStore() {
        MoocchatUserSession.UserSessionStore.add(this);
    }

    private removeFromStore() {
        MoocchatUserSession.UserSessionStore.remove(this);
    }
}