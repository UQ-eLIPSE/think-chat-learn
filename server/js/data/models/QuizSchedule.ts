import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class QuizSchedule extends Database<IDB_QuizSchedule> {
    constructor(db: mongodb.Db) {
        super(db, "uq_quizSchedule");
    }
}

export type IDB_QuizSchedule = DBSchema.QuizSchedule<mongodb.ObjectID, Date>;
