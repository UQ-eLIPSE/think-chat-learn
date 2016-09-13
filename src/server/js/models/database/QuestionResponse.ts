import {tables} from "../../classes/data/Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUESTION_RESPONSE;

export class QuestionResponse extends DatabaseWrapper<IDB_QuestionResponse> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionResponse {
    _id?: ObjectId,
    optionId?: ObjectId,
    justification?: string,
    timestamp?: Date
}
