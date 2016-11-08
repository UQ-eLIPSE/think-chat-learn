import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class Question extends Database<IDB_Question> {
    constructor(db: mongodb.Db) {
        super(db, "uq_question");
    }
}

export type IDB_Question = DBSchema.Question<mongodb.ObjectID>;
