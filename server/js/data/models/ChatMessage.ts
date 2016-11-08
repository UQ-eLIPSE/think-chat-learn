import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class ChatMessage extends Database<IDB_ChatMessage> {
    constructor(db: mongodb.Db) {
        super(db, "uq_chatMessage");
    }
}

export type IDB_ChatMessage = DBSchema.ChatMessage<mongodb.ObjectID, Date>;
