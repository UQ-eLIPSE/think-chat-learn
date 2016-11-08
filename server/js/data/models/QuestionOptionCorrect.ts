import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuestionOptionCorrect extends Database<IDB_QuestionOptionCorrect> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionOptionCorrect");
    }
}

export type IDB_QuestionOptionCorrect = DBSchema.QuestionOptionCorrect<mongodb.ObjectID>;
