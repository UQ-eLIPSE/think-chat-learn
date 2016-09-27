import * as mongodb from "mongodb";

import {Database} from "../Database";

export class ChatMessage extends Database<IDB_ChatMessage> {
    constructor(db: mongodb.Db) {
        super(db, "uq_chatMessage");
    }
}

export interface IDB_ChatMessage {
    _id?: mongodb.ObjectID,
    sessionId?: mongodb.ObjectID,
    timestamp?: Date,
    content?: string
}
