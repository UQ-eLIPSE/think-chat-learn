import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.CHAT_MESSAGE;

export class ChatMessage extends DatabaseWrapper<IDB_ChatMessage> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_ChatMessage {
    _id?: string,
    sessionId?: string,
    timestamp?: Date,
    content?: string
}
