import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class ChatGroup extends Database<IDB_ChatGroup> {
    constructor(db: mongodb.Db) {
        super(db, "uq_chatGroup");
    }
}

export type IDB_ChatGroup = DBSchema.ChatGroup<mongodb.ObjectID>;
