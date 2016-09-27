import * as mongodb from "mongodb";

import {Database} from "../Database";

export class QuestionOptionCorrect extends Database<IDB_QuestionOptionCorrect> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionOptionCorrect");
    }
}

export interface IDB_QuestionOptionCorrect {
    _id?: mongodb.ObjectID,
    questionId?: mongodb.ObjectID,
    optionId?: mongodb.ObjectID,
    justification?: string
}
