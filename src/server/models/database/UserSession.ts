import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.USER_SESSION;

export class UserSession extends DatabaseWrapper<IDB_UserSession> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_UserSession {
    _id?: string,
    userUuid?: string,
    quizScheduleId?: string,
    timestampStart?: Date,
    timestampEnd?: Date,
    responseInitialId?: string,
    responseFinalId?: string,
    chatGroupId?: string
}
