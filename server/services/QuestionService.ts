import { BaseService } from "./BaseService";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { TypeQuestion, QuestionType } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";

export class QuestionService extends BaseService{

    protected readonly questionRepo: QuestionRepository;

    constructor(_questionRepo: QuestionRepository){
        super();
        this.questionRepo = _questionRepo;
}

    // Creates a question based on the data input. It can distinguish between MCQ and Qualitatives
    public async createQuestion(data: TypeQuestion): Promise<string> {
        // Check for the type
        if (data.type === QuestionType.MCQ) {
            if (data.options && data.options.length) {
                data.options.forEach((option) => {
                    option._id = (new ObjectId()).toHexString();
                })
            } else {
                throw Error("Missing options in an MCQ question");
            }
        }

        // Qualitative should not need any further action
        return this.questionRepo.create(data);
    }

    
    public async updateQuestion(data: TypeQuestion): Promise<boolean> {
        // Only MCQ require special consideration
        if (!data._id) {
            throw Error("No id to update from");
        }


        if (data.type === QuestionType.MCQ) {
            if (data.options && data.options.length) {
                data.options.forEach((option) => {
                    option._id = (new ObjectId()).toHexString();
                })
            } else {
                throw Error("Missing options in an MCQ question");
            }            
        }
        console.log(data);
        return this.questionRepo.updateOne(data);
    }

    // Deletes a question based on the incoming id
    public async deleteQuiz(id: string) {
        console.log(id);
        return this.questionRepo.deleteOne(id);
    }

    // TODO  determine if questions need to be associated with courses
    // at the moment, getting all of the questions
    public async getAllQuestions(): Promise<TypeQuestion[]> {
        return this.questionRepo.findAll({
        });
    }

    public async getQuestion(id: string): Promise<TypeQuestion | null> {
        return this.questionRepo.findOne(id);
    }
}