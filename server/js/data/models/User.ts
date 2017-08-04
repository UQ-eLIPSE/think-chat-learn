import * as mongodb from "mongodb";

import {Database} from "../Database";
import * as DBSchema from "../../../../common/interfaces/DBSchema";

export class User extends Database<IDB_User> {
    constructor(db: mongodb.Db) {
        super(db, "uq_user");
    }
}

export type IDB_User = DBSchema.User<mongodb.ObjectID>;
