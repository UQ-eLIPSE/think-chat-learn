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
    // private _socket: PacSeqSocket_Server;
    private _sockets: PacSeqSocket_Server[] = [];


    public static GetSessionIds() {
        return MoocchatUserSession.UserSessionStore.getSessionIds();
    }

    public static GetSession(sessionId: string, socket?: PacSeqSocket_Server) {
        const session = MoocchatUserSession.UserSessionStore.getSession(sessionId);

        // Update socket reference in case someone has switched/disconnected-connected sockets
        if (session && socket && !session.socketAlreadySaved(socket)) {
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



        const socket = session.getSocket();

        if (socket) {
            if (sendTerminateMessage) {
                socket.emit("terminated");
            }

            // Give a little bit of time before disconnecting
            setTimeout(() => {
                PacSeqSocket_Server.Destroy(socket);
                session._sockets = [];
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
        if (this.socketAlreadySaved(socket)) {
            // Don't do anything if socket previously set
            return;
        }

        this._sockets.push(socket);
    }

    public getSocket() {
        // Return the most up to date socket
        return this._sockets[this._sockets.length - 1];
    }
    
    private socketPosition(socket: PacSeqSocket_Server) {
        // Check by matching ID
        for (let i = 0; i < this._sockets.length; i++) {
            const _socket = this._sockets[i];
            
            if (_socket.id === socket.id) {
                return i;
            }
        }

        return -1;

        // return this._sockets.indexOf(socket);
    }

    private socketAlreadySaved(socket: PacSeqSocket_Server) {
        return this.socketPosition(socket) > -1;
    }

    private addToStore() {
        MoocchatUserSession.UserSessionStore.add(this);
    }

    private removeFromStore() {
        MoocchatUserSession.UserSessionStore.remove(this);
    }
}