import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUESTION_RESPONSE;

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
    timestamp?: Date
}
