import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.USER;

export class User extends DatabaseWrapper<IDB_User> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_User {
    uuid?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}
