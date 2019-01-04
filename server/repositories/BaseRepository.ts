import { Collection, Db, ObjectID } from "mongodb";
import { Document } from "../../common/interfaces/DBSchema";

// Assumes strings for id transfers
export abstract class BaseRepository<T extends Document>{

    protected collection: Collection;

    constructor(_db: Db, _collectionName:string){
        this.collection = _db.collection(_collectionName);
    }

    protected convertItemToDocument(item:Partial<T>):any {
        let document: any = Object.assign({}, item);
        if (item._id) {
            document._id = this.convertStringIdToObjectId(item._id);
        }
        return document;
    }

    protected convertDocumentToItem(document:any):T {
        let item: any = Object.assign({}, document);
        if(document._id){
            item._id = this.convertObjectIdtoStringId(document._id as ObjectID);
        }
        return item as T;
    }

    protected convertStringIdToObjectId(id: string | undefined): ObjectID | undefined {
        return id ? new ObjectID(id) : new ObjectID();
    }

    protected convertObjectIdtoStringId(id: ObjectID): string {
        return id.toHexString();
    }

    async create(item: T): Promise<string>{
        const convertedItem = this.convertItemToDocument(item);
        const result = await this.collection.insertOne(convertedItem);

        return this.convertObjectIdtoStringId(result.insertedId);
    }

    async updateOne(item: Partial<T>, _id?: string): Promise<boolean>{
        const id = item._id ? this.convertStringIdToObjectId(item._id) : this.convertStringIdToObjectId(_id);
        
        if(typeof(id) === "undefined"){
            throw new Error("No id given");
        }

        const convertedItem = this.convertItemToDocument(item);
        delete convertedItem._id;
        const newValues = {
            $set: convertedItem
        };
        const result = await this.collection.updateOne({_id: id}, newValues);
        return result.result.ok === 1;
    }

    async findOne(_id: string): Promise<T | null>;
    async findOne(item: Partial<T>): Promise<T | null>;
    async findOne(identifier: string | Partial<T>): Promise<T | null>{
        let result = null;
        if(typeof identifier === "string"){
            result = await this.collection.findOne({_id: this.convertStringIdToObjectId(identifier) });
        }
        else{
            const convertedItem = this.convertItemToDocument(identifier);
            result = await this.collection.findOne(convertedItem);
        }

        if (result) {
            result = this.convertDocumentToItem(result);
        }

        return result;
    }

    async findByIdArray(_id: string[]): Promise<T[] | null>;
    async findByIdArray(item: Partial<T>[]): Promise<T[] | null>;
    async findByIdArray(identifier: string[] | Partial<T>[]): Promise<T[] | null> {
        // Type checking for arrays takes a little bit of effort
        if (Array.isArray(identifier)) {
            // Unfortunately typescript gets angry with not being able to 
            // handle the overloaded identifier 
            const isStringArray = (identifier as any[]).every((element) => {
                return typeof element === "string";
            });
            if (isStringArray) {
                // Remember to convert each element to an object ID
                const result = await this.collection.find({ _id: { 
                        $in: (identifier as string[]).map((element) => { 
                            return this.convertStringIdToObjectId(element) 
                        }) 
                    }
                });
                return result.toArray().then((output) => {
                    output = output.map((element) => {
                        return this.convertDocumentToItem(element);
                    });

                    return Promise.resolve(output);
                });
            }
        }
        const query = (identifier as Partial<T>[]).map((item) => {
            return this.convertItemToDocument(item);
        })
        const result = await this.collection.find({_id: { $in: query }});
        return result.toArray().then((output) => {
            output = output.map((element) => {
                return this.convertDocumentToItem(element);
            });

            return Promise.resolve(output);
        });

    }

    async findAll(item: Partial<T>): Promise<T[]>{
        const convertedItem = this.convertItemToDocument(item);
        let result = await this.collection.find(convertedItem).toArray();
        result = result.map((resultItem) => {
            return this.convertDocumentToItem(resultItem);
        });
        return result;
    }

    async findOrCreate(query:Partial<T>, item:T): Promise<T>{
        const convertedQuery = this.convertItemToDocument(query);
        const convertedItem = this.convertItemToDocument(item);
        //remove overlapping keys due to $set and $setOnInsert not allowing overlap
        const newValues = {
            $setOnInsert: convertedItem
        }
        return this.collection.findOneAndUpdate(convertedQuery, newValues, {
            upsert: true,
            returnOriginal: false,
        }).then((result) => {
            result.value = this.convertDocumentToItem(result.value);
            return result.value;
        })
    }

    async deleteOne(_id: string): Promise<boolean>;
    async deleteOne(item: Partial<T>): Promise<boolean>;
    async deleteOne(identifier: string | Partial<T>): Promise<boolean>{
        if (typeof(identifier) === 'string') {
            const result = await this.collection.deleteOne({_id: this.convertStringIdToObjectId(identifier) });
            return result.deletedCount! > 0;
        }

        const convertedIdentifier = this.convertItemToDocument(identifier);
        const result = await this.collection.deleteOne(convertedIdentifier);
        return result.deletedCount! > 0;
    }
}