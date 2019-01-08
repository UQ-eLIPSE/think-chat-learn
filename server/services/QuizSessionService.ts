import { BaseService } from "./BaseService";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { IQuizSession } from "../../common/interfaces/DBSchema";

export class QuizSessionService extends BaseService{

    protected readonly quizSessionRepo: QuizSessionRepository;

    constructor(_quizSessionRepo: QuizSessionRepository){
        super();
        this.quizSessionRepo = _quizSessionRepo;
}

    // Creates a user session assuming the body is valid
    public async createQuizSession(data: IQuizSession): Promise<string> {

        return this.quizSessionRepo.create(data);
    }

    // Simply an override. 
    public async updateQuizSession(data: IQuizSession): Promise<boolean> {
        return this.quizSessionRepo.updateOne(data);
    }

    // Deletes a quiz based on the incoming id
    public async deleteQuizSession(id: string) {
        return this.quizSessionRepo.deleteOne(id);
    }

    // Gets the quiz session based on quiz ids
    public async getQuizSessions(quizId: string): Promise<IQuizSession[]> {
        return this.quizSessionRepo.findAll({
            quizId
        });
    }

    // Gets the quiz session based on the id itself
    public async getQuizSession(sessionId: string): Promise<IQuizSession | null> {
        return this.quizSessionRepo.findOne(sessionId);
    }
}