import * as mongodb from "mongodb";

import {Database} from "../Database";

export class QuestionOption extends Database<IDB_QuestionOption> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionOption");
    }
}

export interface IDB_QuestionOption {
    _id?: mongodb.ObjectID,
    questionId?: mongodb.ObjectID,
    sequence?: number,
    content?: string
}
