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
}