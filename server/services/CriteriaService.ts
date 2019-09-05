import { BaseService } from "./BaseService";
import { ICriteria } from "../../common/interfaces/DBSchema";
import { CriteriaRepository } from "../repositories/CriteriaRepository";
export class CriteriaService extends BaseService<ICriteria> {

    protected readonly criteriaRepo: CriteriaRepository;

    constructor(_criteraRepo: CriteriaRepository){
        super();
        this.criteriaRepo = _criteraRepo;
    }

    // Creates a criteria
    public async createOne(data: ICriteria): Promise<string> {
        this.validateCriteria(data);
        return this.criteriaRepo.create(data);
    }

    // Simply an override to the existing criteria
    public async updateOne(data: ICriteria): Promise<boolean> {
        this.validateCriteria(data);
        return this.criteriaRepo.updateOne(data);
    }

    // Deletes a criteria based on the id
    public async deleteOne(_id: string) {
        return this.criteriaRepo.deleteOne(_id);
    }

    // Gets a criteria based on id
    public async findOne(_id: string): Promise<ICriteria | null> {
        return this.criteriaRepo.findOne(_id);
    }

    private validateCriteria(maybeCriteria: ICriteria) {
        if (!maybeCriteria.course) {
            throw new Error("No course provided");
        }

        if (!maybeCriteria.description) {
            throw new Error("No description provided");
        }

        if (!maybeCriteria.name) {
            throw new Error("No name provided");
        }
    }
}