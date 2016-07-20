import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUESTION_OPTION_CORRECT;

export class QuestionOptionCorrect extends DatabaseWrapper<IDB_QuestionOptionCorrect> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionOptionCorrect {
    _id?: string,
    questionId?: string,
    optionId?: string,
    justification?: string
}
