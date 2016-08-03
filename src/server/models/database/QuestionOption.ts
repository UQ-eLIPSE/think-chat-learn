import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUESTION_OPTION;

export class QuestionOption extends DatabaseWrapper<IDB_QuestionOption> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionOption {
    _id?: ObjectId,
    questionId?: ObjectId,
    sequence?: number,
    content?: string
}
