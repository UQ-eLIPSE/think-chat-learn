declare const global: any;

import {MoocchatUserSession} from "./MoocchatUserSession";
import {MoocchatWaitPool} from "./MoocchatWaitPool";


const io: SocketIO.Server = global.io;


export class MoocchatBackupClientQueue {
    private static BackupClientQueues: { [quizSessionId: string]: MoocchatBackupClientQueue } = {};

    private _sessions: MoocchatUserSession[];
    private _quizSessionId: string;

    private sessionToCall: MoocchatUserSession;
    private callNoResponseTimeoutHandle: number;

    public static GetQueue(quizSessionId: string) {
        if (!MoocchatBackupClientQueue.BackupClientQueues.hasOwnProperty(quizSessionId)) {
            // Create new queue
            return new MoocchatBackupClientQueue(quizSessionId);
        }

        return MoocchatBackupClientQueue.BackupClientQueues[quizSessionId];
    }

    /** Slight misnomer - gets queue with same quiz schedule as supplied session. Session may not actually be in wait pool. */
    public static GetQueueWith(session: MoocchatUserSession) {
        return MoocchatBackupClientQueue.GetQueue(session.data.quizSchedule._id.toString());
    }

    public static Destroy(chatGroup: MoocchatBackupClientQueue) {
        chatGroup._quizSessionId = undefined;
        chatGroup._sessions = [];

        delete MoocchatBackupClientQueue.BackupClientQueues[chatGroup.getQuizSessionId()];
    }






    constructor(quizSessionId: string) {
        this._quizSessionId = quizSessionId;
        this._sessions = [];

        // Put into singleton map
        MoocchatBackupClientQueue.BackupClientQueues[this.getQuizSessionId()] = this;
    }

    public getQuizSessionId() {
        return this._quizSessionId;
    }

    public getSessions() {
        return this._sessions;
    }


    public broadcast(event: string, data: any) {
        this.getSessions().forEach((session) => {
            const socket = session.getSocket();

            // ======= Logging starts here =======

            var loggedData = [
                'socket.io' + socket.id,
                'OUTBOUND',
                '[' + event + ']'
            ];

            if (typeof data !== "undefined") {
                loggedData.push(data);
            }

            console.log.apply(undefined, loggedData);

            // ======= Logging ends here =======

            socket.emit(event, data);
        });
    }

    public broadcastQueueChange() {
        this.broadcast("backupClientQueueUpdate", {
            clients: this._sessions.map((session) => {
                return {
                    username: session.data.username
                }
            })
        });
    }

    private numberOfSessions() {
        return this._sessions.length;
    }

    public addSession(session: MoocchatUserSession) {
        if (this._sessions.indexOf(session) > -1) {
            return;
        }

        this._sessions.push(session);

        this.broadcastQueueChange();

        session.getSocket().emit("backupClientEnterQueueState", {
            success: true
        });
    }

    public removeSession(session: MoocchatUserSession) {
        const sessionIndex = this._sessions.indexOf(session);

        if (sessionIndex < 0) {
            return;
        }

        const removedSession = this._sessions.splice(sessionIndex, 1)[0];

        if (this.sessionToCall === removedSession) {
            clearTimeout(this.callNoResponseTimeoutHandle);
            this.sessionToCall = undefined;
        }

        this.broadcastQueueChange();

        return removedSession;
    }


    /**
     * @return {boolean} Whether call has been made and we are waiting for a backup client to pop over to the supplied wait pool
     */
    public callToPool(waitPool: MoocchatWaitPool) {
        if (this.numberOfSessions() === 0) {
            return false;
        }

        // If already called, then return true while we wait
        if (this.sessionToCall) {
            return true;
        }

        // Set session to call
        this.sessionToCall = this._sessions[0];

        const noResponseFunc = () => {
            const sessionToCall = this.sessionToCall;

            if (sessionToCall) {
                sessionToCall.getSocket().removeListener("backupClientTransferConfirm", responseFunc);
                sessionToCall.getSocket().emit("backupClientEjected");
                this.removeSession(sessionToCall);
            }

            // Run again
            this.callToPool(waitPool);
        }

        const responseFunc = () => {
            const sessionToCall = this.sessionToCall;

            clearTimeout(this.callNoResponseTimeoutHandle);

            this.removeSession(sessionToCall);
            waitPool.addSession(sessionToCall);
        }

        // If no response then timeout handler will run to move backup client queue on
        this.callNoResponseTimeoutHandle = setTimeout(noResponseFunc, global.conf.backupClient.callConfirmTimeoutMs);

        this.sessionToCall.getSocket().once("backupClientTransferConfirm", responseFunc);

        this.sessionToCall.getSocket().emit("backupClientTransferCall");

        return true;
    }
}