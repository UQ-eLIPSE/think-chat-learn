import { BaseService } from "./BaseService";
import { ResponseRepository } from "../repositories/ResponseRepository";
import { Response } from "../../common/interfaces/DBSchema";

export class ResponseService extends BaseService{

    protected readonly responseRepo: ResponseRepository;

    constructor(_responseRepo: ResponseRepository){
        super();
        this.responseRepo = _responseRepo;
}

    // Creates a user session assuming the body is valid. Additionally if
    // the response is already present, throw an error
    public async createResponse(data: Response): Promise<string> {

        const inDB = await this.checkQuizSessionQuestionInDb(data.quizSessionId, data.questionId);
        if (!inDB) {
            return this.responseRepo.create(data);
        } else {
            // Throw an error due to violation
            throw new Error(`Attempted to create a response with a quiz session ID of ${data.quizSessionId}
                 and question ID of ${data.questionId}`);
        }
    }

    // Simply an override. 
    public async updateResponse(data: Response): Promise<boolean> {
        return this.responseRepo.updateOne(data);
    }

    // Deletes a response based on the id
    public async deleteResponse(id: string) {
        return this.responseRepo.deleteOne(id);
    }

    // Gets the quiz session based on the combination of quiz and question ids
    public async getResponses(quizId: string, questionId: string): Promise<Response[]> {
        return this.responseRepo.findAll({
            quizId,
            questionId
        });
    }

    // Gets the response based on the id itself
    public async getResponse(responseId: string): Promise<Response | null> {
        return this.responseRepo.findOne(responseId);
    }

    // Checks whether or not the response already exists in the db
    private async checkQuizSessionQuestionInDb(quizSessionId: string, questionId: string): Promise<boolean> {
        return await this.responseRepo.findResponseByQuizSessionQuestion(quizSessionId, questionId) ? true : false;
    }
}