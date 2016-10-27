import * as mongodb from "mongodb";

import {Database} from "../Database";

export class Question extends Database<IDB_Question> {
    constructor(db: mongodb.Db) {
        super(db, "uq_question");
    }
}

export interface IDB_Question {
    _id?: mongodb.ObjectID,
    title?: string,
    content?: string,
    course?: string,
}
