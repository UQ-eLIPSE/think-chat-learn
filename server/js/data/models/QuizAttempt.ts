import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuizAttempt extends Database<IDB_QuizAttempt> {
    constructor(db: mongodb.Db) {
        super(db, "uq_quizAttempt");
    }
}

export type IDB_QuizAttempt = DBSchema.QuizAttempt<mongodb.ObjectID>;
