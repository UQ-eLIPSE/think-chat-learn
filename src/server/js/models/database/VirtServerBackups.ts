import {tables} from "./Tables";
import {DatabaseWrapper} from "../DatabaseWrapper";

const tableName = tables.VIRTSERVER_BACKUPS;

export class VirtServerBackups extends DatabaseWrapper<IDB_VirtServer_Backups> {
    constructor(database: any) {
        super(tableName);
        this.init(database);
    }
}

export interface IDB_VirtServer_Backups {
    _id?: ObjectId,
    timestamp?: Date,
    json?: string,
    sessionId: string
}
