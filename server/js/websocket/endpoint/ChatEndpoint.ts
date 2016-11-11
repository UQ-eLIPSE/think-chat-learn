import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import { MoocchatWaitPool } from "../../queue/MoocchatWaitPool";
import { MoocchatBackupClientQueue } from "../../queue/MoocchatBackupClientQueue";

import * as mongodb from "mongodb";

import { QuizAttempt } from "../../quiz/QuizAttempt";

import { ChatGroup } from "../../chat/ChatGroup";
import { ChatMessage } from "../../chat/ChatMessage";

import { ChatGroupFormationLoop } from "../../chat/ChatGroupFormationLoop";

export class ChatEndpoint extends WSEndpoint {
    private static async HandleJoinRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupJoin) {
        const quizAttempt = await QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group join request with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const existingChatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        // Can't join into pool if already in chat group
        if (existingChatGroup) {
            return console.error(`Attempted chat group join request with quiz attempt already in chat group; quiz attempt ID = ${quizAttempt.getId()}`);
        }

        const waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(quizAttempt);

        // Can't join into pool if already in pool
        if (waitPool.hasQuizAttempt(quizAttempt)) {
            return console.error(`Attempted chat group join request with quiz attempt already in pool; quiz attempt ID = ${quizAttempt.getId()}`);
        }

        // Add quiz attempt into wait pool
        waitPool.addQuizAttempt(quizAttempt);


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

    private static async HandleTypingNotification(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupTypingNotification) {
        const quizAttempt = await QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group typing notification with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        chatGroup.setTypingState(session, data.isTyping);
    }

    private static async HandleQuitStatusChange(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupQuitStatusChange) {
        const quizAttempt = await QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group typing notification with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        if (data.quitStatus) {
            chatGroup.quitSession(session);
        }
    }

    private static async HandleMessage(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupSendMessage, db: mongodb.Db) {
        const quizAttempt = await QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group message with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        const chatMessage = await ChatMessage.Create(db, {
            content: data.message,
            timestamp: new Date(),
        }, chatGroup, quizAttempt);

        chatGroup.broadcastMessage(session, chatMessage.getMessage());
    }




    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onJoinRequest() {
        return (data: IWSToServerData.ChatGroupJoin) => {
            ChatEndpoint.HandleJoinRequest(this.getSocket(), data)
                .catch(e => console.error(e));
        };
    }

    public get onTypingNotification() {
        return (data: IWSToServerData.ChatGroupTypingNotification) => {
            ChatEndpoint.HandleTypingNotification(this.getSocket(), data)
                .catch(e => console.error(e));
        };
    }

    public get onQuitStatusChange() {
        return (data: IWSToServerData.ChatGroupQuitStatusChange) => {
            ChatEndpoint.HandleQuitStatusChange(this.getSocket(), data)
                .catch(e => console.error(e));
        }
    }

    public get onMessage() {
        return (data: IWSToServerData.ChatGroupSendMessage) => {
            ChatEndpoint.HandleMessage(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
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