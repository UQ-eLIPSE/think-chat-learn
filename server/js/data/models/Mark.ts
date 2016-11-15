import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class Mark extends Database<IDB_Mark> {
    constructor(db: mongodb.Db) {
        super(db, "uq_mark");
    }
}

export type IDB_Mark = DBSchema.Mark<mongodb.ObjectID, Date>;
