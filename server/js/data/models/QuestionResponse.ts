import * as mongodb from "mongodb";

import {Database} from "../Database";

export class QuestionResponse extends Database<IDB_QuestionResponse> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionResponse");
    }
}

export interface IDB_QuestionResponse {
    _id?: mongodb.ObjectID,
    optionId?: mongodb.ObjectID,
    justification?: string,
    timestamp?: Date
}
