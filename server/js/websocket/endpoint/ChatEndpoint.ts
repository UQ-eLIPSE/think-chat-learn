import {WSEndpoint} from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import {PacSeqSocket_Server} from "../../../../common/js/PacSeqSocket_Server";

import {MoocchatUserSession} from "../../user/MoocchatUserSession";
import {MoocchatWaitPool} from "../../queue/MoocchatWaitPool";
import {MoocchatBackupClientQueue} from "../../queue/MoocchatBackupClientQueue";

import * as mongodb from "mongodb";
import {Database} from "../../data/Database";
import {ChatMessage} from "../../data/models/ChatMessage";

import {ChatGroupFormationLoop} from "../../chat/chatGroupFormationLoop";

export class ChatEndpoint extends WSEndpoint {
    private static HandleJoinRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupJoin) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted chat group join request with invalid session ID = " + data.sessionId);
        }

        // Can't join into pool if already in chat group
        if (session.chatGroup) {
            return console.error(`Attempted chat group join request with session already in chat group; session ID = ${session.getId()}`);
        }

        const waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(session);

        // Can't join into pool if already in pool
        if (waitPool.hasSession(session)) {
            return console.error(`Attempted chat group join request with session already in pool; session ID = ${session.getId()}`);
        }

        // Add session into wait pool
        waitPool.addSession(session);


        // Run the chat group formation loop now
        const cgfl = ChatGroupFormationLoop.GetChatGroupFormationLoop(waitPool);

        if (cgfl) {
            cgfl.forceRun();
        }

        // Update backup queue
        const backupClientQueue = MoocchatBackupClientQueue.GetQueueWithQuizScheduleFrom(session);

        if (backupClientQueue) {
            backupClientQueue.broadcastWaitPoolCount();
        }
    }

    private static HandleTypingNotification(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupTypingNotification) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted chat group typing notification with invalid session ID = " + data.sessionId);
        }

        const chatGroup = session.chatGroup;

        if (!chatGroup) {
            return console.error("Could not find chat group for session ID = " + data.sessionId);
        }

        chatGroup.setTypingState(session, data.isTyping);
    }

    private static HandleQuitStatusChange(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupQuitStatusChange) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted chat group quit request with invalid session ID = " + data.sessionId);
        }

        const chatGroup = session.chatGroup;

        if (!chatGroup) {
            return console.error("Could not find chat group for session ID = " + data.sessionId);
        }

        if (data.quitStatus) {
            chatGroup.quitSession(session);
        }
    }

    private static HandleMessage(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupSendMessage, db: mongodb.Db) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted chat group message from invalid session ID = " + data.sessionId);
        }

        const chatGroup = session.chatGroup;

        if (!chatGroup) {
            return console.error("Could not find chat group for session ID = " + data.sessionId);
        }

        new ChatMessage(db).insertOne({
            content: data.message,
            sessionId: new Database.ObjectId(session.getId()),
            timestamp: new Date()
        });

        chatGroup.broadcastMessage(session, data.message);
    }




    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onJoinRequest() {
        return (data: IWSToServerData.ChatGroupJoin) => {
            ChatEndpoint.HandleJoinRequest(this.getSocket(), data);
        };
    }

    public get onTypingNotification() {
        return (data: IWSToServerData.ChatGroupTypingNotification) => {
            ChatEndpoint.HandleTypingNotification(this.getSocket(), data);
        };
    }

    public get onQuitStatusChange() {
        return (data: IWSToServerData.ChatGroupQuitStatusChange) => {
            ChatEndpoint.HandleQuitStatusChange(this.getSocket(), data);
        }
    }

    public get onMessage() {
        return (data: IWSToServerData.ChatGroupSendMessage) => {
            ChatEndpoint.HandleMessage(this.getSocket(), data, this.db);
        }
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "chatGroupJoinRequest": return this.onJoinRequest;
            case "chatGroupTypingNotification": return this.onTypingNotification;
            case "chatGroupQuitStatusChange": return this.onQuitStatusChange;
            case "chatGroupMessage": return this.onMessage;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "chatGroupJoinRequest",
            "chatGroupTypingNotification",
            "chatGroupQuitStatusChange",
            "chatGroupMessage",
        ]);
    }
}