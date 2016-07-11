import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.SURVEY;

export class Survey extends DatabaseWrapper<IDB_Survey> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_Survey {
    _id?: string,
    availableStart?: Date,
    content?: IDB_Survey_Content[]
}

export type IDB_Survey_ContentType = "TEXT_SHORT" | "MULTIPLECHOICE_INLINE" | "MULTIPLECHOICE_LIST"; 

export interface IDB_Survey_Content {
    type?: IDB_Survey_ContentType,
    questionStatement?: string,

    /** For Multiple Choice only */
    values: string[]
}