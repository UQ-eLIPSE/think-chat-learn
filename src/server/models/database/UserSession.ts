import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.USER_SESSION;

export class UserSession extends DatabaseWrapper<IDB_UserSession> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_UserSession {
    _id?: ObjectId,
    userUuid?: ObjectId,
    quizScheduleId?: ObjectId,
    timestampStart?: Date,
    timestampEnd?: Date,
    responseInitialId?: ObjectId,
    responseFinalId?: ObjectId,
    chatGroupId?: string
}
