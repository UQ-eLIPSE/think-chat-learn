import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.QUIZ_SCHEDULE;

export class QuizSchedule extends DatabaseWrapper<IDB_QuizSchedule> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuizSchedule {
    _id?: string;
    questionId?: string;
    course?: string;
    availableStart?: Date;
    availableEnd?: Date;
    blackboardColumnId?: number;
}
