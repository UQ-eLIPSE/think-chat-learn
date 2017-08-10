import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuestionResponse extends Database<IDB_QuestionResponse> {
    constructor(db: mongodb.Db) {
        super(db, "uq_questionResponse");
    }
}

export type IDB_QuestionResponse = DBSchema.QuestionResponse<mongodb.ObjectID, Date>;
