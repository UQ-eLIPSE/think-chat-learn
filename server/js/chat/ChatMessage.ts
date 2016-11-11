import * as mongodb from "mongodb";
import { ChatMessage as DBChatMessage, IDB_ChatMessage } from "../data/models/ChatMessage";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { QuizAttempt } from "../quiz/QuizAttempt";
import { ChatGroup } from "./ChatGroup";

export class ChatMessage {
    private static readonly Store = new KVStore<ChatMessage>();

    private data: IDB_ChatMessage;
    private readonly quizAttempt: QuizAttempt;
    private readonly chatGroup: ChatGroup;

    private readonly db: mongodb.Db;

    public static Get(chatMessageId: string) {
        return ChatMessage.Store.get(chatMessageId);
    }

    public static GetWithQuizAttempt(quizAttempt: QuizAttempt) {
        return ChatMessage.Store.getValues().filter(chatMessage => chatMessage.getQuizAttempt() === quizAttempt);
    }

    public static GetWithChatGroup(chatGroup: ChatGroup) {
        return ChatMessage.Store.getValues().filter(ChatMessage => ChatMessage.getChatGroup() === chatGroup);
    }

    public static async GetAutoFetch(db: mongodb.Db, chatMessageId: string) {
        const chatMessage = ChatMessage.Get(chatMessageId);

        if (chatMessage) {
            return chatMessage;
        }

        return await ChatMessage.Fetch(db, chatMessageId);
    }

    public static async Create(db: mongodb.Db, data: IDB_ChatMessage, chatGroup: ChatGroup, quizAttempt: QuizAttempt) {
        const dbChatMessage = new DBChatMessage(db).getCollection();

        data.chatGroupId = chatGroup.getOID();
        data.quizAttemptId = quizAttempt.getOID();

        await dbChatMessage.insertOne(data);

        return new ChatMessage(db, data, chatGroup, quizAttempt);
    }

    public static async Fetch(db: mongodb.Db, chatMessageId: string): Promise<ChatMessage | undefined> {
        const dbChatMessage = new DBChatMessage(db).getCollection();

        let chatMessage: IDB_ChatMessage | null = await dbChatMessage.findOne(
            {
                _id: new mongodb.ObjectID(chatMessageId),
            }
        );

        if (!chatMessage) {
            return undefined;
        }

        const chatGroup = await ChatGroup.GetAutoFetch(db, chatMessage.chatGroupId.toHexString());

        if (!chatGroup) {
            throw new Error(`Chat group "${chatMessage.chatGroupId.toHexString()}" missing for chat message "${chatMessage._id.toHexString()}"`)
        }

        const quizAttempt = await QuizAttempt.GetAutoFetch(db, chatMessage.quizAttemptId.toHexString());

        if (!quizAttempt) {
            throw new Error(`Quiz attempt "${chatMessage.quizAttemptId.toHexString()}" missing for chat message "${chatMessage._id.toHexString()}"`)
        }

        return new ChatMessage(db, chatMessage, chatGroup, quizAttempt);
    }

    private static async Update(chatMessage: ChatMessage, updateData: IDB_ChatMessage) {
        const dbChatMessage = new DBChatMessage(chatMessage.getDb()).getCollection();

        const result = await dbChatMessage.findOneAndUpdate(
            {
                _id: chatMessage.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        chatMessage.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_ChatMessage, chatGroup: ChatGroup, quizAttempt: QuizAttempt) {
        this.data = data;
        this.chatGroup = chatGroup;
        this.quizAttempt = quizAttempt;
        this.db = db;

        this.addToStore();
    }

    private getDb() {
        return this.db;
    }

    public getOID() {
        return this.data._id;
    }

    public getId() {
        return this.data._id.toHexString();
    }

    public getData() {
        return this.data;
    }

    public getQuizAttempt() {
        return this.quizAttempt;
    }

    public getChatGroup() {
        return this.chatGroup;
    }

    public getMessage() {
        return this.data.content;
    }

    private addToStore() {
        ChatMessage.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        ChatMessage.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();
    }
}