import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class UserSession extends Database<IDB_UserSession> {
    constructor(db: mongodb.Db) {
        super(db, "uq_userSession");
    }
}

export type IDB_UserSession = DBSchema.UserSession<mongodb.ObjectID, Date>;
