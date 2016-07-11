import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.QUESTION_RESPONSE;

export class QuestionResponse extends DatabaseWrapper<IDB_QuestionResponse> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionResponse {
    _id?: string,
    optionId?: string,
    justification?: string,
    timestampStart?: Date,
    timestampEnd?: Date
}
