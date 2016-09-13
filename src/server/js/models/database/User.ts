import {tables} from "../../classes/data/Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.USER;

export class User extends DatabaseWrapper<IDB_User> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_User {
    _id?: ObjectId;
    username?: string;
    firstName?: string;
    lastName?: string;
    researchConsent?: boolean;
}
