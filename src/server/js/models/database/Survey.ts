import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.SURVEY;

export class Survey extends DatabaseWrapper<IDB_Survey> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_Survey {
    _id?: ObjectId;
    availableStart?: Date;
    content?: IDB_Survey_Content[];
}

export type IDB_Survey_ContentType = "HEADING" | "TEXT_SHORT" | "MULTIPLECHOICE_INLINE" | "MULTIPLECHOICE_LIST"; 

export interface IDB_Survey_Content {
    type?: IDB_Survey_ContentType;
    
    /** For TextShort + MultipleChoice* */
    questionStatement?: string;

    /** For Multiple Choice only */
    values?: string[];

    /** For Headings only */
    headingContent?: string;
}