import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.QUESTION;

export class Question extends DatabaseWrapper<IDB_Question> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_Question {
    _id?: string,
    content?: string
}
