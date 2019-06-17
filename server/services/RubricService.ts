import { BaseService } from "./BaseService";
import { IRubric } from "../../common/interfaces/DBSchema";
import { RubricRepository } from "../repositories/RubricRepository";
export class RubricService extends BaseService<IRubric> {

    protected readonly rubricRepo: RubricRepository;

    constructor(_rubricRepo: RubricRepository){
        super();
        this.rubricRepo = _rubricRepo;
    }

    // Creates a criteria
    public async createOne(data: IRubric): Promise<string> {

        return this.rubricRepo.create(data);
    }

    // Simply an override to the existing criteria
    public async updateOne(data: IRubric): Promise<boolean> {
        return this.rubricRepo.updateOne(data);
    }

    // Deletes a criteria based on the id
    public async deleteOne(_id: string) {
        return this.rubricRepo.deleteOne(_id);
    }

    // Gets a criteria based on id
    public async findOne(_id: string): Promise<IRubric | null> {
        return this.rubricRepo.findOne(_id);
    }
}