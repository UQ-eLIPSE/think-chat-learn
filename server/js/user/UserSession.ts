import * as mongodb from "mongodb";
import { Database } from "../data/Database";
import * as DBSchema from "../../../common/interfaces/DBSchema";
import { UserSession as DBUserSession, IDB_UserSession } from "../data/models/UserSession";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { User } from "./User";

// Referred to by...
import { QuizAttempt } from "../quiz/QuizAttempt";

export class UserSession {
    private static readonly Store = new KVStore<UserSession>();

    private data: IDB_UserSession;
    private readonly user: User;

    private readonly db: mongodb.Db;

    public static GetWith(user: User) {
        return UserSession.Store.getValues().filter(session => session.getUser() === user);
    }

    public static Get(sessionId: string) {
        return UserSession.Store.get(sessionId);
    }

    public static async GetAutoFetch(db: mongodb.Db, userSessionId: string) {
        const userSession = UserSession.Get(userSessionId);

        if (userSession) {
            return userSession;
        }

        return await UserSession.Fetch(db, userSessionId);
    }

    public static async Fetch(db: mongodb.Db, userSessionId: string): Promise<UserSession | undefined> {
        const dbUserSession = new DBUserSession(db).getCollection();

        let userSession: IDB_UserSession | null = await dbUserSession.findOne(
            {
                _id: new mongodb.ObjectID(userSessionId),
            }
        );

        if (!userSession) {
            return undefined;
        }

        const user = await User.GetAutoFetch(db, userSession.userId.toHexString());

        if (!user) {
            throw new Error(`User "${userSession.userId.toHexString()}" missing for user session "${userSession._id.toHexString()}"`)
        }

        return new UserSession(db, userSession, user);
    }

    public static async FetchSessions(db: mongodb.Db, user: User): Promise<UserSession[]> {
        const dbUserSession = new DBUserSession(db).getCollection();

        let userSessions: IDB_UserSession[] = await dbUserSession.find(
            {
                userId: user.getOID(),
            }
        ).toArray();

        return userSessions.map(userSession => {
            const existingObj = UserSession.Get(userSession._id.toHexString());

            if (existingObj) {
                return existingObj;
            }

            return new UserSession(db, userSession, user);
        });
    }

    public static async Create(db: mongodb.Db, user: User, type: DBSchema.UserSessionType) {
        const dbUserSession = new DBUserSession(db).getCollection();

        const newSessionData: IDB_UserSession = {
            _id: Database.GenerateRandomOID(),
            userId: user.getOID(),
            timestampStart: new Date(),
            timestampEnd: null,
            type,
        }

        await dbUserSession.insertOne(newSessionData);

        return new UserSession(db, newSessionData, user);
    }

    private static async Update(userSession: UserSession, updateData: IDB_UserSession) {
        const dbUser = new DBUserSession(userSession.getDb()).getCollection();

        const result = await dbUser.findOneAndUpdate(
            {
                _id: userSession.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        userSession.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_UserSession, user: User) {
        this.data = data;
        this.user = user;
        this.db = db;

        this.addToStore();

        console.log(`Session '${this.getId()}' created; User = ${this.getUser().getId()}`);
    }

    private getDb() {
        return this.db;
    }

    public getOID() {
        return this.data._id;
    }

    public getId() {
        return this.data._id.toHexString();
    }

    public getUser() {
        return this.user;
    }

    private async setTimestampEnd() {
        await UserSession.Update(this, {
            timestampEnd: new Date(),
        });
    }

    private addToStore() {
        UserSession.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        UserSession.Store.delete(this.getId());
    }

    public async end() {
        await this.setTimestampEnd();
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        QuizAttempt.GetWithUserSession(this).forEach(_ => _.destroyInstance());
    }
}