import { BaseService } from "./BaseService";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { IQuizSession } from "../../common/interfaces/DBSchema";
import { UserSessionRepository } from "../repositories/UserSessionRepository";

export class QuizSessionService extends BaseService{

    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly userSessionRepo: UserSessionRepository;

    constructor(_quizSessionRepo: QuizSessionRepository, _userSessionRepo: UserSessionRepository) {
        super();
        this.quizSessionRepo = _quizSessionRepo;
        this.userSessionRepo = _userSessionRepo;
    }

    // Creates a user session assuming the body is valid
    public async createQuizSession(data: IQuizSession): Promise<string> {
        // When creating the quiz session, set the complete to false
        // as we only allow the value to be true from updates
        data.complete = false;
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

    // Gets the quiz session by the combination of userId and quizId
    public async getQuizSessionbyUserQuiz(userId: string, quizId: string): Promise<IQuizSession | null> {
        // Fetch all user the user sessions
        const usersessions = await this.userSessionRepo.findUserSessionsByUserId(userId);
        const quizSession = await this.quizSessionRepo.findQuizSessionByUserQuiz(
            usersessions.map((element) => { return element._id! }, []), quizId);
        return quizSession;
    }
}