import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuestionOption extends Database<IDB_QuestionOption> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionOption");
    }
}

export type IDB_QuestionOption = DBSchema.QuestionOption<mongodb.ObjectID>;
