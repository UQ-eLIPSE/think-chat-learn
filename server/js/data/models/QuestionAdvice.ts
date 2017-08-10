import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuestionAdvice extends Database<IDB_QuestionAdvice> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionAdvice");
    }
}

export type IDB_QuestionAdvice = DBSchema.QuestionAdvice<mongodb.ObjectID>;
