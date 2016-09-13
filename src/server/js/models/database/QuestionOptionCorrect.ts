import {tables} from "../../classes/data/Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.QUESTION_OPTION_CORRECT;

export class QuestionOptionCorrect extends DatabaseWrapper<IDB_QuestionOptionCorrect> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_QuestionOptionCorrect {
    _id?: ObjectId,
    questionId?: ObjectId,
    optionId?: ObjectId,
    justification?: string
}
