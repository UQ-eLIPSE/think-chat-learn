import {WSEndpoint} from "../WSEndpoint";

import * as IWSToServerData from "../../../../../common/js/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../../common/js/interfaces/IWSToClientData";
import {PacSeqSocket_Server} from "../../../../../common/js/classes/PacSeqSocket_Server";

import {Database} from "../../data/Database";

import {MoocchatUserSession} from "../../user/MoocchatUserSession";
import {MoocchatBackupClientQueue} from "../../queue/MoocchatBackupClientQueue";

export class BackupClientEndpoint extends WSEndpoint {
    private static HandleEnterQueue(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientAnswer) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted backup client enter queue with invalid session ID = " + data.sessionId);
        }

        // Process question response data by saving response
        // (answer and justification) to the session object only and not the DB
        //
        // TODO: This will need to be changed to allow DB storage for JIRA #96
        session.data.response.initial.optionId = new Database.ObjectId(data.optionId);
        session.data.response.initial.justification = data.justification;

        // Add the client to the backup queue here, only *after* we
        // have all the information for question/answer
        const backupClientQueue = MoocchatBackupClientQueue.GetQueueWithQuizScheduleFrom(session);

        if (backupClientQueue) {
            backupClientQueue.addSession(session);
        }
    }

    private static HandleReturnToQueue(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientReturnToQueue) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted backup client return to queue with invalid session ID = " + data.sessionId);
        }

        // If session does not have answer information attached, we can't return to queue
        if (!(session.data.response.initial.optionId && session.data.response.initial.justification)) {
            return console.error(`Session "${session.getId()}" attempted backup client return to queue when answers not fully available`);
        }

        const backupClientQueue = MoocchatBackupClientQueue.GetQueueWithQuizScheduleFrom(session);

        if (backupClientQueue) {
            backupClientQueue.addSession(session);
        }
    }

    private static HandleStatusRequest(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientStatusRequest) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted backup client status request with invalid session ID = " + data.sessionId);
        }

        const backupClientQueue = MoocchatBackupClientQueue.GetQueueWithQuizScheduleFrom(session);

        if (backupClientQueue) {
            backupClientQueue.broadcastQueueChange();
            backupClientQueue.broadcastWaitPoolCount();
        }
    }






    constructor(socket: PacSeqSocket_Server) {
        super(socket);
    }

    public get onEnterQueue() {
        return (data: IWSToServerData.BackupClientAnswer) => {
            BackupClientEndpoint.HandleEnterQueue(this.getSocket(), data);
        };
    }

    public get onReturnToQueue() {
        return (data: IWSToServerData.BackupClientReturnToQueue) => {
            BackupClientEndpoint.HandleReturnToQueue(this.getSocket(), data);
        };
    }

    public get onStatusRequest() {
        return (data: IWSToServerData.BackupClientStatusRequest) => {
            BackupClientEndpoint.HandleStatusRequest(this.getSocket(), data);
        };
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "backupClientEnterQueue": return this.onEnterQueue;
            case "backupClientReturnToQueue": return this.onReturnToQueue;
            case "backupClientStatusRequest": return this.onStatusRequest;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "backupClientEnterQueue",
            "backupClientReturnToQueue",
            "backupClientStatusRequest",
        ]);
    }
}