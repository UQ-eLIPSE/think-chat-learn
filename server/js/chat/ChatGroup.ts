import * as mongodb from "mongodb";
import { ChatGroup as DBChatGroup, IDB_ChatGroup } from "../data/models/ChatGroup";
import { ChatGroupMonitor } from "./ChatGroupMonitor";
import { KVStore } from "../../../common/js/KVStore";

import { Utils } from "../../../common/js/Utils";

// Refers to...
import { QuizAttempt } from "../quiz/QuizAttempt";
import { QuizSchedule } from "../quiz/QuizSchedule";

export class ChatGroup {
    private static readonly Store = new KVStore<ChatGroup>();

    private data: IDB_ChatGroup;
    private /*readonly*/ quizAttempts: QuizAttempt[];
    private /*readonly*/ quizSchedule: QuizSchedule;

    private /*readonly*/ clientsCurrentlyTyping: QuizAttempt[] = [];
    private /*readonly*/ clientsThatQuit: QuizAttempt[] = [];

    private /*readonly*/ db: mongodb.Db;

    private monitor: ChatGroupMonitor;

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

        chatGroupId = chatGroup._id!.toHexString();

        if (!chatGroup.quizScheduleId) {
            throw new Error(`Quiz schedule ID missing for chat group "${chatGroupId}"`);
        }

        const quizScheduleId = chatGroup.quizScheduleId.toHexString();

        const quizSchedule = await QuizSchedule.GetAutoFetch(db, quizScheduleId);

        if (!quizSchedule) {
            throw new Error(`Quiz schedule "${quizScheduleId}" missing for chat group "${chatGroupId}"`)
        }

        if (!chatGroup.quizAttemptIds) {
            throw new Error(`Quiz attempt IDs missing for chat group "${chatGroupId}"`);
        }

        const quizAttemptFetchPromises: Promise<QuizAttempt>[] = [];

        chatGroup.quizAttemptIds.forEach((quizAttemptId) => {
            const promise = QuizAttempt.GetAutoFetch(db, quizAttemptId.toHexString());
            quizAttemptFetchPromises.push(promise);
        });

        const quizAttempts = await Promise.all(quizAttemptFetchPromises);

        if (quizAttempts.length !== quizAttemptFetchPromises.length) {
            throw new Error(`Could not fetch all quiz attempts for chat group "${chatGroupId}"`);
        }

        return new ChatGroup(db, chatGroup, quizSchedule, quizAttempts);
    }

    // private static async Update(chatGroup: ChatGroup, updateData: IDB_ChatGroup) {
    //     const dbChatGroup = new DBChatGroup(chatGroup.getDb()).getCollection();

    //     const result = await dbChatGroup.findOneAndUpdate(
    //         {
    //             _id: chatGroup.getOID(),
    //         },
    //         {
    //             $set: updateData,
    //         },
    //         {
    //             returnOriginal: false,
    //         }
    //     );

    //     // Update data for this object
    //     chatGroup.data = result.value;
    // }

    private constructor(db: mongodb.Db, data: IDB_ChatGroup, quizSchedule: QuizSchedule, quizAttempts: QuizAttempt[]) {
        this.data = data;
        this.quizSchedule = quizSchedule;
        this.quizAttempts = quizAttempts;
        this.db = db;
        
        this.addToStore();

        const id = this.getId();

        this.quizAttempts.forEach((quizAttempt) => {
            console.log(`ChatGroup(${id}) JOIN Quiz Attempt '${quizAttempt.getId()}'`);
        });

        this.notifyEveryoneOnJoin();
        const question = this.quizSchedule.getQuestion().getData();

        // Check if system prompt statements are available
        if(question !== undefined && question.systemChatPromptStatements !== null && question.systemChatPromptStatements !== undefined) {
            // Init chat group monitor
            this.monitor = new ChatGroupMonitor(question.systemChatPromptStatements, 2, this);
        }
        
    }

    // private getDb() {
    //     return this.db;
    // }

    public getOID() {
        return this.data._id!;
    }

    public getId() {
        return this.getOID().toHexString();
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

    public broadcast(event: string, data: any) {
        this.getQuizAttempts().forEach((quizAttempt) => {
            // Don't broadcast message to those already quit
            if (this.clientsThatQuit.indexOf(quizAttempt) > -1) {
                return;
            }

            const socket = quizAttempt.getUserSession().getSocket();

            if (socket) {
                socket.emit(event, data);
            }
        });
    }

    public numberOfActiveClients() {
        return this.quizAttempts.length - this.clientsThatQuit.length;
    }

    public broadcastSystemMessage(message: string) {
        const systemMessage = {
            message: message,
            timestamp: Date.now()
        };
        this.broadcast("chatGroupSystemMessage", systemMessage);
    }

    public broadcastMessage(quizAttempt: QuizAttempt, message: string) {
        const chatGroupMessage = {
            clientIndex: this.getQuizAttemptIndex(quizAttempt),
            message: message,
            timestamp: Date.now()
        };
        this.broadcast("chatGroupMessage", chatGroupMessage);
        this.monitor.registerMessage(chatGroupMessage);
        // Remove the session that just sent the message from the typing sessions array
        this.setTypingState(quizAttempt, false);
    }

    public setTypingState(quizAttempt: QuizAttempt, isTyping: boolean) {
        const quizAttemptIndex = this.clientsCurrentlyTyping.indexOf(quizAttempt);

        if (isTyping && quizAttemptIndex < 0) {
            this.clientsCurrentlyTyping.push(quizAttempt);
        } else if (!isTyping && quizAttemptIndex > -1) {
            this.clientsCurrentlyTyping.splice(quizAttemptIndex, 1);
        }

        this.updateTypingNotifications();
    }

    private updateTypingNotifications() {
        this.broadcast("chatGroupTypingNotification", {
            clientIndicies: this.clientsCurrentlyTyping.map(quizAttempt => this.getQuizAttemptIndex(quizAttempt))
        });
    }

    private broadcastQuit(quittingClient: QuizAttempt, quitStatus: boolean = true) {
        // Don't broadcast quit event when the session has already quit
        if (this.clientsThatQuit.indexOf(quittingClient) > -1) {
            return;
        }

        this.broadcast("chatGroupQuitChange", {
            groupId: this.getId(),
            groupSize: this.numberOfActiveClients(),

            clientIndex: this.getQuizAttemptIndex(quittingClient),
            quitStatus: quitStatus
        });
    }

    public quitQuizAttempt(quittingClient: QuizAttempt) {
        this.setTypingState(quittingClient, false);

        // You must broadcast the quit BEFORE actually quitting
        this.broadcastQuit(quittingClient);

        // If not previously tracked as quitted, add to quit array
        if (this.clientsThatQuit.indexOf(quittingClient) < 0) {
            console.log(`ChatGroup(${this.getId()}) QUIT Quiz Attempt '${quittingClient.getId()}'`);
            this.clientsThatQuit.push(quittingClient);
        }

        // Self destroy when there are no sessions left
        if (this.numberOfActiveClients() === 0) {
            this.destroyInstance();
        }
    }

    private notifyEveryoneOnJoin() {
        const chatGroupId = this.getId();
        const numberOfActiveClients = this.numberOfActiveClients();
        const quizAttemptsInGroup = this.getQuizAttempts();

        quizAttemptsInGroup.forEach((quizAttempt) => {
            const socket = quizAttempt.getUserSession().getSocket();

            if (!socket) {
                return;
            }

            const groupAnswers = quizAttemptsInGroup.map((_quizAttempt) => {
                const responseInitial = _quizAttempt.getResponseInitial();

                if (!responseInitial) {
                    console.error(`Quiz attempt "${_quizAttempt.getId()}" has no response initial object during chat group formation`);
                }

                return {
                    clientIndex: this.getQuizAttemptIndex(_quizAttempt),
                    answer: responseInitial ? responseInitial.getData() : {},   // TODO: Returning object literal as placeholder; response initial should be required before proceeding to chat group formation in the first place 
                };
            });

            Utils.Array.shuffleInPlace(groupAnswers);

            socket.emit("chatGroupFormed", {
                groupId: chatGroupId,
                groupSize: numberOfActiveClients,
                groupAnswers,
                clientIndex: this.getQuizAttemptIndex(quizAttempt)
            });
        })
    }

    private addToStore() {
        ChatGroup.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        ChatGroup.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.monitor.destroyMonitor();
        this.removeFromStore();
        delete this.monitor;
        delete this.clientsCurrentlyTyping;
        delete this.clientsThatQuit;
        delete this.data;
        delete this.db;
        delete this.quizAttempts;
        delete this.quizSchedule;
    }
}
