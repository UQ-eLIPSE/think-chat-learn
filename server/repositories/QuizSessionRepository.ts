import { BaseRepository } from "./BaseRepository";
import { IQuizSession } from "../../common/interfaces/DBSchema";

export class QuizSessionRepository extends BaseRepository<IQuizSession> {
    async findQuizSessionByUserQuiz(userSessionIds: string[], quizId: string): Promise<IQuizSession | null> {
        let result = await this.collection.findOne({
            userSessionId: { 
                $in: userSessionIds
            },
            quizId
        });
        return result;
    }
}