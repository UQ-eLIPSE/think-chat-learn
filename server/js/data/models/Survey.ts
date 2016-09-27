import * as mongodb from "mongodb";

import {Database} from "../Database";

export class Survey extends Database<IDB_Survey> {
    constructor(db: mongodb.Db) {
        super(db, "uq_survey");
    }
}

export interface IDB_Survey {
    _id?: mongodb.ObjectID;
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