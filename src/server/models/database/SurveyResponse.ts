import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

import {IDB_Survey_ContentType} from "./Survey";

let tableName = tables.SURVEY_RESPONSE;

export class SurveyResponse extends DatabaseWrapper<IDB_SurveyResponse> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_SurveyResponse {
    sessionId?: string,
    surveyId?: string,
    timestamp?: Date,
    content?: IDB_SurveyResponse_Content[]
}

export interface IDB_SurveyResponse_Content {
    type?: IDB_Survey_ContentType,
    
    /**
     * Types:
     * => string = text
     * => number = multiple choice index (0-based) 
     */
    value?: string | number,
}