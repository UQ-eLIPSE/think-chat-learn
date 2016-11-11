import * as mongodb from "mongodb";
import { ChatGroup as DBChatGroup, IDB_ChatGroup } from "../data/models/ChatGroup";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { QuizAttempt } from "../quiz/QuizAttempt";
import { QuizSchedule } from "../quiz/QuizSchedule";

export class ChatGroup {
    private static readonly Store = new KVStore<ChatGroup>();

    private data: IDB_ChatGroup;
    private readonly quizAttempts: QuizAttempt[];
    private readonly quizSchedule: QuizSchedule;

    private readonly db: mongodb.Db;

    public static Get(chatGroupId: string) {
        return ChatGroup.Store.get(chatGroupId);
    }

    public static GetWithQuizAttempt(quizAttempt: QuizAttempt): ChatGroup | undefined {
        return ChatGroup.Store.getValues().filter(chatGroup => chatGroup.hasQuizAttempt(quizAttempt))[0];
    }

    public static GetWithQuizSchedule(quizSchedule: QuizSchedule) {
        return ChatGroup.Store.getValues().filter(chatGroup => chatGroup.getQuizSchedule() === quizSchedule);
    }

    public static async GetAutoFetch(db: mongodb.Db, chatGroupId: string) {
        const chatGroup = ChatGroup.Get(chatGroupId);

        if (chatGroup) {
            return chatGroup;
        }

        return await ChatGroup.Fetch(db, chatGroupId);
    }

    public static async Create(db: mongodb.Db, data: IDB_ChatGroup, quizSchedule: QuizSchedule, quizAttempts: QuizAttempt[]) {
        const dbChatGroup = new DBChatGroup(db).getCollection();

        data.quizScheduleId = quizSchedule.getOID();
        data.quizAttemptIds = quizAttempts.map(quizAttempt => quizAttempt.getOID());

        await dbChatGroup.insertOne(data);

        return new ChatGroup(db, data, quizSchedule, quizAttempts);
    }

    public static async Fetch(db: mongodb.Db, chatGroupId: string): Promise<ChatGroup | undefined> {
        const dbChatGroup = new DBChatGroup(db).getCollection();

        let chatGroup: IDB_ChatGroup | null = await dbChatGroup.findOne(
            {
                _id: new mongodb.ObjectID(chatGroupId),
            }
        );

        if (!chatGroup) {
            return undefined;
        }

        const quizSchedule = await QuizSchedule.GetAutoFetch(db, chatGroup.quizScheduleId.toHexString());

        if (!quizSchedule) {
            throw new Error(`Quiz schedule "${chatGroup.quizScheduleId.toHexString()}" missing for chat group "${chatGroup._id.toHexString()}"`)
        }

        const quizAttemptFetchPromises: Promise<QuizAttempt>[] = [];

        chatGroup.quizAttemptIds.forEach((quizAttemptId) => {
            const promise = QuizAttempt.GetAutoFetch(db, quizAttemptId.toHexString());
            quizAttemptFetchPromises.push(promise);
        });

        const quizAttempts = await Promise.all(quizAttemptFetchPromises);

        if (quizAttempts.length !== quizAttemptFetchPromises.length) {
            throw new Error(`Could not fetch all quiz attempts for chat group "${chatGroup._id.toHexString()}"`);
        }

        return new ChatGroup(db, chatGroup, quizSchedule, quizAttempts);
    }

    private static async Update(chatGroup: ChatGroup, updateData: IDB_ChatGroup) {
        const dbChatGroup = new DBChatGroup(chatGroup.getDb()).getCollection();

        const result = await dbChatGroup.findOneAndUpdate(
            {
                _id: chatGroup.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        chatGroup.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_ChatGroup, quizSchedule: QuizSchedule, quizAttempts: QuizAttempt[]) {
        this.data = data;
        this.quizSchedule = quizSchedule;
        this.quizAttempts = quizAttempts;
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

    public getQuizAttempts() {
        return this.quizAttempts;
    }

    public getQuizSchedule() {
        return this.quizSchedule;
    }

    public getQuizAttemptIndex(quizAttempt: QuizAttempt) {
        return this.quizAttempts.indexOf(quizAttempt);
    }

    public hasQuizAttempt(quizAttempt: QuizAttempt) {
        return this.getQuizAttemptIndex(quizAttempt) > -1;
    }

    private addToStore() {
        ChatGroup.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        ChatGroup.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();
    }
}