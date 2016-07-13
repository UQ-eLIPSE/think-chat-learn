import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.QUESTION_OPTION;

export class QuestionOption extends DatabaseWrapper<IDB_QuestionOption> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionOption {
    _id?: string,
    questionId?: string,
    sequence?: number,
    content?: string
}
