import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUIZ_SCHEDULE;

export class QuizSchedule extends DatabaseWrapper<IDB_QuizSchedule> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuizSchedule {
    _id?: ObjectId;
    questionId?: ObjectId;
    course?: string;
    availableStart?: Date;
    availableEnd?: Date;
    blackboardColumnId?: number;
}
