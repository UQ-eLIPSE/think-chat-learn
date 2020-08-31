import { BaseService } from "./BaseService";
import { IRubric, IRubricCriteria } from "../../common/interfaces/DBSchema";
import { RubricRepository } from "../repositories/RubricRepository";
import { CriteriaRepository } from "../repositories/CriteriaRepository";
export class RubricService extends BaseService<IRubric> {

    protected readonly rubricRepo: RubricRepository;
    protected readonly criteriaRepo: CriteriaRepository;

    constructor(_rubricRepo: RubricRepository, _criteriaRepo: CriteriaRepository){
        super();
        this.rubricRepo = _rubricRepo;
        this.criteriaRepo = _criteriaRepo;
    }

    // Creates a criteria
    public async createOne(data: IRubric): Promise<string> {
        this.validateRubric(data);
        return this.rubricRepo.create(data);
    }

    // Simply an override to the existing criteria
    public async updateOne(data: IRubric): Promise<boolean> {
        this.validateRubric(data);
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

    private validateRubric(maybeRubric: IRubric) {
        if (!maybeRubric.course) {
            throw new Error("No course provided");
        }

        if (!maybeRubric.name) {
            throw new Error("No name provided for the rubric");
        }

        const duplicateRubric = maybeRubric.criterias.some((criteria) => {
            const criteriaCount = maybeRubric.criterias.reduce((count, otherCriteria) => {
                if (otherCriteria === criteria) {
                    count = count + 1;
                }
                return count;
            }, 0);

            return criteriaCount !== 1;
        });

        if (duplicateRubric) {
            throw new Error("Duplicate criterias detected");
        }
    }

    public async fetchCriteriaPopulatedRubricById(rubricId: string): Promise<IRubricCriteria | null> {

        try {
            const rubric = await this.rubricRepo.findOne(rubricId);
            if(!rubric || !rubric.criterias) throw new Error('Rubric could not be found/ does not contain criteria');
    
            const criteriaForRubric = await this.criteriaRepo.findByIdArray(rubric.criterias);
    
            if(!criteriaForRubric || !criteriaForRubric.length) throw new Error('Criteria could not be found');
    
            delete rubric.criterias;
    
            const rubricWithCriteria = Object.assign({}, { criteria: criteriaForRubric }, rubric);
    
            return rubricWithCriteria;
        } catch(e) {
            console.error('Rubric error: ',  e.message);
            return null;
        }


    }
}