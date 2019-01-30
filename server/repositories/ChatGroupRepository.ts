import { BaseRepository } from "./BaseRepository";
import { IChatGroup } from "../../common/interfaces/DBSchema";

export class ChatGroupRepository extends BaseRepository<IChatGroup>{
    async findChatGroupsByIds(quizSessionId: string): Promise<IChatGroup[]> {

        /**
         * Allowing group reformation means that a quiz session is not a unique
         * entry in the chat group table.
         * Suppose we allow group reformation in the future and to handle disconnects. We
         * would probably need to store the current group joined in a given session. I.e.
         * a socketsession knows which quizsession it is a part of and which group it is.
         * I.e. the combination of group and quizsession is unique instead of just quizsession
         * within the chatgroup table
        */

        let result = await this.collection.find({
            quizSessionIds: quizSessionId
        }).toArray();
        return result;
    }
}