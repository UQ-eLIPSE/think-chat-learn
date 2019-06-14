import { BaseService } from "./BaseService";
import { ICriteria } from "../../common/interfaces/DBSchema";
import { CriteriaRepository } from "../repositories/CriteriaRepository";
export class CriteriaService extends BaseService {

    protected readonly criteriaRepo: CriteriaRepository;

    constructor(_criteraRepo: CriteriaRepository){
        super();
        this.criteriaRepo = _criteraRepo;
    }

    // Creates a criteria
    public async createCriteria(data: ICriteria): Promise<string> {

        return this.criteriaRepo.create(data);
    }

    // Simply an override to the existing criteria
    public async updateCriteria(data: ICriteria): Promise<boolean> {
        return this.criteriaRepo.updateOne(data);
    }

    // Deletes a criteria based on the id
    public async deleteCriteria(_id: string) {
        return this.criteriaRepo.deleteOne(_id);
    }

    // Gets a criteria based on id
    public async getCriteria(_id: string): Promise<ICriteria | null> {
        return this.criteriaRepo.findOne(_id);
    }
}