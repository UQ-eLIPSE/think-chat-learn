import * as mongodb from "mongodb";

import {Database} from "../Database";

export class QuizSchedule extends Database<IDB_QuizSchedule> {
    constructor(db: mongodb.Db) {
        super(db, "uq_quizSchedule");
    }
}

export interface IDB_QuizSchedule {
    _id?: mongodb.ObjectID;
    questionId?: mongodb.ObjectID;
    course?: string;
    availableStart?: Date;
    availableEnd?: Date;
    blackboardColumnId?: number;
}
