import * as mongodb from "mongodb";

import {Database} from "../Database";

export class VirtServerBackups extends Database<IDB_VirtServer_Backups> {
    constructor(db: mongodb.Db) {
        super(db, "uq_virtserverBackups");
    }
}

export interface IDB_VirtServer_Backups {
    _id?: mongodb.ObjectID,
    timestamp?: Date,
    json?: string,
    sessionId: string
}
