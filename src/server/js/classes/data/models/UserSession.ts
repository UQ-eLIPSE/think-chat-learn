import * as mongodb from "mongodb";

import {Database} from "../Database";

export class UserSession extends Database<IDB_UserSession> {
    constructor(db: mongodb.Db) {
        super(db, "uq_userSession");
    }
}

export interface IDB_UserSession {
    _id?: mongodb.ObjectID,
    userId?: mongodb.ObjectID,
    quizScheduleId?: mongodb.ObjectID,
    timestampStart?: Date,
    timestampEnd?: Date,
    responseInitialId?: mongodb.ObjectID,
    responseFinalId?: mongodb.ObjectID,
    chatGroupId?: string
}
