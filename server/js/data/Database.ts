import * as mongodb from "mongodb";

export abstract class Database<CollectionData> {
    public static ObjectId = mongodb.ObjectID;


    public static Connect(url: string, callback?: mongodb.MongoCallback<mongodb.Db>) {
        mongodb.MongoClient.connect(url, callback);
    }

    public static Collection(db: mongodb.Db, collectionName: string, callback?: mongodb.MongoCallback<mongodb.Collection>) {
        db.collection(collectionName, callback);
    }

    public static InsertOne<CollectionData>(collection: mongodb.Collection, data: CollectionData, callback?: mongodb.MongoCallback<mongodb.InsertOneWriteOpResult>) {
        collection.insertOne(data, callback);
    }

    public static InsertMany<CollectionData>(collection: mongodb.Collection, dataArray: CollectionData[], callback?: mongodb.MongoCallback<mongodb.InsertWriteOpResult>) {
        collection.insertMany(dataArray, callback);
    }

    public static CursorToArray<CollectionData>(cursor: mongodb.Cursor, callback?: mongodb.MongoCallback<CollectionData[]>) {
        cursor.toArray(callback);
    }

    public static ReadWithCursor(collection: mongodb.Collection, query?: Object) {
        return collection.find(query);
    }

    public static UpdateOne(collection: mongodb.Collection, filter: Object, update: Object, callback?: mongodb.MongoCallback<mongodb.UpdateWriteOpResult>) {
        collection.updateOne(filter, update, callback);
    }

    public static Delete(collection: mongodb.Collection, filter: Object, callback?: mongodb.MongoCallback<mongodb.DeleteWriteOpResultObject>) {
        collection.deleteOne(filter, callback);
    }

    public static Close(db: mongodb.Db, callback?: mongodb.MongoCallback<void>) {
        db.close(callback);
    }



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

    private getCollection() {
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

    public insertOne(data: CollectionData, callback?: mongodb.MongoCallback<mongodb.InsertOneWriteOpResult>) {
        Database.InsertOne(this.getCollection(), data, callback);
    }

    public insertMany(dataArray: CollectionData[], callback?: mongodb.MongoCallback<mongodb.InsertWriteOpResult>) {
        Database.InsertMany(this.getCollection(), dataArray, callback);
    }

    public readAsArray(query?: Object, callback?: mongodb.MongoCallback<CollectionData[]>) {
        Database.CursorToArray(this.readWithCursor(query), callback);
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