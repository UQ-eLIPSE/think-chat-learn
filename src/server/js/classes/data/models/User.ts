import * as mongodb from "mongodb";

import {Database} from "../Database";

export class User extends Database<IDB_User> {
    constructor(db: mongodb.Db) {
        super(db, "uq_user");
    }
}

export interface IDB_User {
    _id?: mongodb.ObjectID;
    username?: string;
    firstName?: string;
    lastName?: string;
    researchConsent?: boolean;
}
