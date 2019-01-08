import { BaseService } from "./BaseService";
import { ResponseRepository } from "../repositories/ResponseRepository";
import { Response } from "../../common/interfaces/DBSchema";

export class ResponseService extends BaseService{

    protected readonly responseRepo: ResponseRepository;

    constructor(_responseRepo: ResponseRepository){
        super();
        this.responseRepo = _responseRepo;
}

    // Creates a user session assuming the body is valid
    public async createResponse(data: Response): Promise<string> {

        return this.responseRepo.create(data);
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
}