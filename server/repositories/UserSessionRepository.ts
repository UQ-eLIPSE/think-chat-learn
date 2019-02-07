import { BaseRepository } from "./BaseRepository";
import { IUserSession } from "../../common/interfaces/ToClientData";

export class UserSessionRepository extends BaseRepository<IUserSession> {
    async findUserSessionsByUserId(userId: string): Promise<IUserSession[]> {

        let result = await this.collection.find({
            userId
        }).toArray();
        return result.map((element) => {
            return this.convertDocumentToItem(element);
        }, []);
    }
}