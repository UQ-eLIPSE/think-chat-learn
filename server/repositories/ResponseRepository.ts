import { BaseRepository } from "./BaseRepository";
import { Response } from "../../common/interfaces/DBSchema";

export class ResponseRepository extends BaseRepository<Response>{
    // Simply checks for a single instance of a questionId and quizSessionId combination
    public async findResponseByQuizSessionQuestion(quizSessionId: string, questionId: string) {
        return this.collection.findOne({
            quizSessionId,
            questionId
        });
    }    
}