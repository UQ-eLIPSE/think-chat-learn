import { BaseService } from "./BaseService";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { TypeQuestion } from "../../common/interfaces/DBSchema";
import { QuestionType } from "../../common/enums/DBEnums";
import { ObjectId } from "bson";

export class QuestionService extends BaseService<TypeQuestion> {

    protected readonly questionRepo: QuestionRepository;

    constructor(_questionRepo: QuestionRepository) {
        super();
        this.questionRepo = _questionRepo;
    }

    // Creates a question based on the data input. It can distinguish between MCQ and Qualitatives
    public async createOne(data: TypeQuestion): Promise<string> {
        this.validateQuestion(data);

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

    
    public async updateOne(data: TypeQuestion): Promise<boolean> {
        // Only MCQ require special consideration
        if (!data._id) {
            throw Error("No id to update from");
        }

        this.validateQuestion(data);

        if (data.type === QuestionType.MCQ) {
            if (data.options && data.options.length) {
                data.options.forEach((option) => {
                    option._id = (new ObjectId()).toHexString();
                })
            } else {
                throw Error("Missing options in an MCQ question");
            }            
        }
        return this.questionRepo.updateOne(data);
    }

    // Deletes a question based on the incoming id
    public async deleteOne(id: string) {
        return this.questionRepo.deleteOne(id);
    }

    // TODO  determine if questions need to be associated with courses
    // at the moment, getting all of the questions
    public async getAllQuestions(): Promise<TypeQuestion[]> {
        return this.questionRepo.findAll({
        });
    }

    public async findOne(id: string): Promise<TypeQuestion | null> {
        return this.questionRepo.findOne(id);
    }

    private validateQuestion(maybeQuestion: TypeQuestion) {
        if (maybeQuestion.type === QuestionType.MCQ) {
            // Not implemented for now
        } else if (maybeQuestion.type === QuestionType.QUALITATIVE) {
            if (!maybeQuestion.content) {
                throw new Error("Empty content in the question");
            }

            if (!maybeQuestion.courseId) {
                throw new Error("No course provided");
            }

            if (!maybeQuestion.title) {
                throw new Error("No title provided");
            }
        } else {
            throw new Error("Invalid question type");
        }
    }
}