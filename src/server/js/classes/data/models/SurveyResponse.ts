import * as mongodb from "mongodb";

import {Database} from "../Database";

export class SurveyResponse extends Database<IDB_SurveyResponse> {
    constructor(db: mongodb.Db) {
        super(db, "uq_surveyResponse");
    }
}

export interface IDB_SurveyResponse {
    sessionId?: mongodb.ObjectID,
    surveyId?: mongodb.ObjectID,
    timestamp?: Date,
    content?: IDB_SurveyResponse_Content[]
}

export interface IDB_SurveyResponse_Content {
    index?: number;
    
    /**
     * Types:
     * => string = text
     * => number = multiple choice index (0-based) 
     */
    value?: string | number;
}