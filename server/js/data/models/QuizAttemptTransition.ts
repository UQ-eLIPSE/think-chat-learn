import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuizAttemptTransition extends Database<IDB_QuizAttemptTransition> {
    constructor(db: mongodb.Db) {
        super(db, "uq_quizAttemptTransition");
    }
}

export type IDB_QuizAttemptTransition = DBSchema.QuizAttemptTransition<mongodb.ObjectID, Date>;
