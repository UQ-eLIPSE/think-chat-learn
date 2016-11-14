import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class Marking extends Database<IDB_Marking> {
    constructor(db: mongodb.Db) {
        super(db, "uq_marking");
    }
}

export type IDB_Marking = DBSchema.Marking<mongodb.ObjectID, Date>;
