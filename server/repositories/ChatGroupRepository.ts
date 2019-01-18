import { BaseRepository } from "./BaseRepository";
import { IChatGroup } from "../../common/interfaces/DBSchema";

export class ChatGroupRepository extends BaseRepository<IChatGroup>{
    async findChatGroupsByIds(quizSessionId: string, quizId: string, questionId: string): Promise<IChatGroup[]> {
        let result = await this.collection.find({
            quizSessionIds: quizSessionId,
            questionIds: questionId,
            quizId
        }).toArray();
        return result;
    }
}