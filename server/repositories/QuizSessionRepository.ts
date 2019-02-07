import { BaseRepository } from "./BaseRepository";
import { IQuizSession } from "../../common/interfaces/DBSchema";

export class QuizSessionRepository extends BaseRepository<IQuizSession>{
    async findQuizSessionByUserId(userSessionId: string): Promise<IQuizSession | null> {

        /**
         * There should be a 1-1 mapping between quiz session id and user session
        */

        let result = await this.collection.findOne({
            userSessionId
        });
        return result;
    }

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