import { Document } from "../../common/interfaces/DBSchema";

export abstract class BaseService<T extends Document> {
    abstract async createOne(item: Partial<T>): Promise<string>;
    abstract async findOne(id: string): Promise<T | null>;
    abstract async updateOne(item: Partial<T>): Promise<boolean>;
    abstract async deleteOne(id: string): Promise<boolean>;
}