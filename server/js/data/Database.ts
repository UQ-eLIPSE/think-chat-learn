import mongodb from "mongodb";
import crypto from "crypto";

export abstract class Database<CollectionData> {
    public static ObjectId = mongodb.ObjectID;


    public static GenerateRandomOID() {
        return new mongodb.ObjectID(crypto.randomBytes(12).toString('hex'));
    }


    public  static async Connect(url: string) {
        const client = await mongodb.MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return client.db();

    }

    public static Collection(db: mongodb.Db, collectionName: string, callback?: mongodb.MongoCallback<mongodb.Collection>) {
        if (callback) {
            return db.collection(collectionName, callback);
        }

        return db.collection(collectionName);
    }

    public static InsertOne<CollectionData>(collection: mongodb.Collection, data: CollectionData, callback?: mongodb.MongoCallback<mongodb.InsertOneWriteOpResult<any>>) {
        collection.insertOne(data, callback!);
    }

    public static InsertMany<CollectionData>(collection: mongodb.Collection, dataArray: CollectionData[], callback?: mongodb.MongoCallback<mongodb.InsertWriteOpResult<any>>) {
        collection.insertMany(dataArray, callback!);
    }

    public static CursorToArray<CollectionData>(cursor: mongodb.Cursor, callback?: mongodb.MongoCallback<CollectionData[]>): void | Promise<any> {
        if (callback) {
            return cursor.toArray(callback);
        }

        return cursor.toArray();
    }

    public static ReadWithCursor(collection: mongodb.Collection, query?: Object) {
        return collection.find(query);
    }

    public static UpdateOne(collection: mongodb.Collection, filter: Object, update: Object, callback?: mongodb.MongoCallback<mongodb.UpdateWriteOpResult>) {
        collection.updateOne(filter, update, callback!);
    }

    public static Delete(collection: mongodb.Collection, filter: Object, callback?: mongodb.MongoCallback<mongodb.DeleteWriteOpResultObject>) {
        collection.deleteOne(filter, callback!);
    }

    /*public static Close(db: mongodb.Db, callback?: mongodb.MongoCallback<void>): void | Promise<any> {
        if (callback) {
            return db.close(callback);
        }
        return db.close();
    }*/



    private db: mongodb.Db;

    private collectionName: string;
    private collection: mongodb.Collection;


    constructor(db: mongodb.Db, collectionName: string) {
        this.setDatabase(db);
        this.setCollectionName(collectionName);
        this.fetchCollection();
    }

    public getCollectionName() {
        return this.collectionName;
    }

    private setCollectionName(collectionName: string) {
        this.collectionName = collectionName;
    }

    private fetchCollection() {
        this.collection = this.db.collection(this.getCollectionName());
    }

    public getCollection() {
        if (!this.collection) {
            throw new Error("No collection");
        }

        return this.collection;
    }

    protected getDatabase() {
        return this.db;
    }

    private setDatabase(db: mongodb.Db) {
        this.db = db;
    }

    public insertOne(data: CollectionData, callback?: mongodb.MongoCallback<mongodb.InsertOneWriteOpResult<any>>) {
        Database.InsertOne<CollectionData>(this.getCollection(), data, callback);
    }

    public insertMany(dataArray: CollectionData[], callback?: mongodb.MongoCallback<mongodb.InsertWriteOpResult<any>>) {
        Database.InsertMany<CollectionData>(this.getCollection(), dataArray, callback);
    }

    public readAsArray(query?: Object, callback?: mongodb.MongoCallback<CollectionData[]>) {
        Database.CursorToArray<CollectionData>(this.readWithCursor(query), callback);
    }

    public readWithCursor(query?: Object) {
        return Database.ReadWithCursor(this.getCollection(), query);
    }

    public updateOne(filter: Object, update: Object, callback?: mongodb.MongoCallback<mongodb.UpdateWriteOpResult>) {
        Database.UpdateOne(this.getCollection(), filter, update, callback);
    }

    public delete(filter: Object, callback?: mongodb.MongoCallback<mongodb.DeleteWriteOpResultObject>) {
        Database.Delete(this.getCollection(), filter, callback);
    }
}