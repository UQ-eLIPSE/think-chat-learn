import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class Survey extends Database<IDB_Survey> {
    constructor(db: mongodb.Db) {
        super(db, "uq_survey");
    }
}

export type IDB_Survey = DBSchema.Survey<mongodb.ObjectID, Date>;
