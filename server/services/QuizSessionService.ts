import { BaseService } from "./BaseService";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { IQuizSession, Response } from "../../common/interfaces/DBSchema";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ResponseRepository } from "../repositories/ResponseRepository";

export class QuizSessionService extends BaseService{

    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly quizRepo: QuizRepository;
    protected readonly userSessionRepo: UserSessionRepository;
    protected readonly responseRepo: ResponseRepository;

    constructor(_quizSessionRepo: QuizSessionRepository, _userSessionRepo: UserSessionRepository,
        _quizRepo: QuizRepository, _responseRepo: ResponseRepository) {

        super();

        this.quizSessionRepo = _quizSessionRepo;
        this.userSessionRepo = _userSessionRepo;
        this.quizRepo = _quizRepo;
        this.responseRepo = _responseRepo;
    }

    // Creates a user session assuming the body is valid
    public async createQuizSession(data: IQuizSession): Promise<string> {
        const goodData = await this.checkQuizSession(data);
        const someQuizSession = await this.quizSessionRepo.findQuizSessionByUserId(data.userSessionId!);

        if (!goodData || someQuizSession) {
            throw Error("Invalid quiz session");
        }

        // When creating the quiz session, set the complete to false
        // as we only allow the value to be true from updates
        data.startTime = Date.now();
        data.complete = false;
        return this.quizSessionRepo.create(data);
    }

    // Simply an override. 
    public async updateQuizSession(data: IQuizSession): Promise<boolean> {
        const goodData = await this.checkQuizSession(data);

        const maybeQuizSession = await this.quizSessionRepo.findOne(data._id!);

        if (!goodData || !maybeQuizSession || !(maybeQuizSession.quizId === data.quizId) ||
            !(maybeQuizSession.userSessionId === data.userSessionId)) {
            return false;
        }

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

    // Determines if the packet can possibly form a good relationship
    private async checkQuizSession(data: IQuizSession) {
        if (!data.quizId || !data.userSessionId || !data.responses) {
            return false;
        }

        const checkQuiz = await this.quizRepo.findOne(data.quizId);
        const checkUserSession = await this.userSessionRepo.findOne(data.userSessionId);

        const responsePromises: Promise<Response | null>[] = [];
        data.responses.forEach((response) => {
            responsePromises.push(this.responseRepo.findOne(response));
        });
        const checkResponses = await Promise.all(responsePromises);

        if (!checkQuiz || !checkUserSession || !checkResponses ||
            (checkResponses.findIndex((element) => element === null) !== -1)) {
            return false;
        }
        
        return true;
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