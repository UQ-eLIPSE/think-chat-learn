import { BaseService } from "./BaseService";
import { ResponseRepository } from "../repositories/ResponseRepository";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { Response } from "../../common/interfaces/DBSchema";
import { QuizRepository } from "../repositories/QuizRepository";
import { PageType } from "../../common/enums/DBEnums";

export class ResponseService extends BaseService{

    protected readonly responseRepo: ResponseRepository;
    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly quizRepo: QuizRepository;

    constructor(_responseRepo: ResponseRepository, _quizSessionRepo: QuizSessionRepository, _quizRepo: QuizRepository){
        super();
        this.responseRepo = _responseRepo;
        this.quizSessionRepo = _quizSessionRepo;
        this.quizRepo = _quizRepo;
}

    // Creates a user session assuming the body is valid. Additionally if
    // the response is already present, throw an error
    public async createResponse(data: Response): Promise<string> {

        const existingQuizSession = await this.quizSessionRepo.findOne(data.quizSessionId);
        const existingQuiz = await this.quizRepo.findOne(data.quizId);

        if (!existingQuizSession || !existingQuiz) {
            throw new Error(`Attempted to create a response with a non-existent quiz session of ${data.quizSessionId}
                or quiz id of ${data.quizId}`);
        }

        const inDB = await this.checkQuizSessionQuestionInDb(data.quizSessionId, data.questionId);
        if (!inDB) {
            const id = await this.responseRepo.create(data);

            // Once created, remember to assign to responseId to the quizsession
            if (existingQuizSession.responses && existingQuiz.pages) {
                existingQuizSession.responses.push(id);

                const complete = existingQuizSession.responses.length === existingQuiz.pages.reduce((arr: string[], element) => {
                    // This is under the assumption that a good quiz was made. I.e. question ids are unique for question answer pages
                    if (element.type === PageType.QUESTION_ANSWER_PAGE) {
                        arr.push(element.questionId);
                    }

                    return arr;
                }, []).length;

                existingQuizSession.complete = complete;

                await this.quizSessionRepo.updateOne(existingQuizSession);
            }

            return id;
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

    public async updateResponses(data: Response[]): Promise<boolean> {
        const updates: Promise<boolean>[] = [];
        for (let i = 0; i < data.length; i++) {
            updates.push(this.updateResponse(data[i]));
        }

        const outcomes = await Promise.all(updates);
        // If there is at least one false, return false?
        // TODO document this behaviour
        return !outcomes.some((outcome) => {
            return !outcome;
        });
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

    // Gets the response based on quiz and quizsession id
    public async getResponsesByQuizSession(quizSessionId: string): Promise<Response[]> {
        return this.responseRepo.findResponsesByQuizSessionArray([quizSessionId]);
    }

    // Checks whether or not the response already exists in the db
    private async checkQuizSessionQuestionInDb(quizSessionId: string, questionId: string): Promise<boolean> {
        return await this.responseRepo.findResponseByQuizSessionQuestion(quizSessionId, questionId) ? true : false;
    }
}