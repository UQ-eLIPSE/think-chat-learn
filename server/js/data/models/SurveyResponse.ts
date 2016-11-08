import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class SurveyResponse extends Database<IDB_SurveyResponse> {
    constructor(db: mongodb.Db) {
        super(db, "uq_surveyResponse");
    }
}

export type IDB_SurveyResponse = DBSchema.SurveyResponse<mongodb.ObjectID, Date>;