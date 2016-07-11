import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

let tableName = tables.USER;

export class User extends DatabaseWrapper<IDB_User> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_User {
    uuid?: string,
    username?: string
}
