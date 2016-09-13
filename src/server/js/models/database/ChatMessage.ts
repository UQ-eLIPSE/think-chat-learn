import {tables} from "../../classes/data/Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.CHAT_MESSAGE;

export class ChatMessage extends DatabaseWrapper<IDB_ChatMessage> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_ChatMessage {
    _id?: ObjectId,
    sessionId?: ObjectId,
    timestamp?: Date,
    content?: string
}
