import * as mongodb from "mongodb";
import { Database } from "../data/Database";
import { User as DBUser, IDB_User } from "../data/models/User";

import { KVStore } from "../../../common/js/KVStore";

import { IMoocchatIdentityInfo } from "../auth/IMoocchatIdentityInfo";

// Referred to by...
import { UserSession } from "./UserSession";

export class User {
    private static readonly Store = new KVStore<User>();

    private data: IDB_User;

    private readonly db: mongodb.Db;

    public static async FetchAutoCreate(db: mongodb.Db, identity: IMoocchatIdentityInfo) {
        const fetchedUser = await User.FetchByUsername(db, identity.identityId);

        if (fetchedUser) {
            return fetchedUser;
        }

        return await User.Create(db, identity);
    }

    public static async FetchByUsername(db: mongodb.Db, username: string): Promise<User | undefined> {
        const dbUser = new DBUser(db).getCollection();

        let user: IDB_User | null = await dbUser.findOne(
            {
                username,
            }
        );

        if (!user) {
            return undefined;
        }

        return new User(db, user);
    }


    public static Get(userId: string) {
        return User.Store.get(userId);
    }

    public static async GetAutoFetch(db: mongodb.Db, userId: string) {
        const user = User.Get(userId);

        if (user) {
            return user;
        }

        return await User.Fetch(db, userId);
    }

    public static async GetAutoFetchAutoCreate(db: mongodb.Db, identity: IMoocchatIdentityInfo) {
        // Cached storage
        const user = await User.Get(identity.identityId);

        if (user) {
            return user;
        }

        return await User.FetchAutoCreate(db, identity);
    }

    public static async Fetch(db: mongodb.Db, userId: string): Promise<User | undefined> {
        const dbUser = new DBUser(db).getCollection();

        let user: IDB_User | null = await dbUser.findOne(
            {
                _id: new mongodb.ObjectID(userId),
            }
        );

        if (!user) {
            return undefined;
        }

        return new User(db, user);
    }

    public static async Create(db: mongodb.Db, identity: IMoocchatIdentityInfo) {
        const dbUser = new DBUser(db).getCollection();

        const user: IDB_User = {
            _id: Database.GenerateRandomOID(),
            username: identity.identityId,
            firstName: identity.name.given,
            lastName: identity.name.family,
            researchConsent: null
        };

        await dbUser.insertOne(user);

        return new User(db, user);
    }

    private static async Update(user: User, updateData: IDB_User) {
        const dbUser = new DBUser(user.getDb()).getCollection();

        const result = await dbUser.findOneAndUpdate(
            {
                _id: user.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        user.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_User) {
        this.db = db;
        this.data = data;

        this.addToStore();
    }

    private getDb() {
        return this.db;
    }

    public getOID() {
        return this.data._id!;
    }

    public getId() {
        return this.getOID().toHexString();
    }

    public getFirstName() {
        return this.data.firstName;
    }

    public getLastName() {
        return this.data.lastName;
    }

    public getUsername() {
        return this.data.username;
    }

    public getResearchConsent() {
        return this.data.researchConsent;
    }

    public getData() {
        return this.data;
    }

    public async setResearchConsent(researchConsent: boolean) {
        await User.Update(this, {
            researchConsent,
        });
    }

    private addToStore() {
        User.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        User.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        UserSession.GetWith(this).forEach(_ => _.destroyInstance());
    }
}