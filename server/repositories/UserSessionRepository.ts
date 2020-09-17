import { BaseRepository } from "./BaseRepository";
import { IUserSession } from "../../common/interfaces/ToClientData";
import { ObjectId } from "bson";

export class UserSessionRepository extends BaseRepository<IUserSession> {
    async findUserSessionsByUserId(userId: string): Promise<IUserSession[]> {

        let result = await this.collection.find({
            userId
        }).toArray();
        return result.map((element) => {
            return this.convertDocumentToItem(element);
        }, []);
    }

    /**
     * Returns user sessions by userId and course code
     * @param userId database _id of the user
     * @param courseCode Course code from LTI request (E.g. For CHEM1100 Blackboard, CHEM1100_7060_63393)
     */
    async findUserSessionsByUserCourse(userId: string, courseCode: string): Promise<IUserSession[]> {

        let result = await this.collection.find({
            userId,
            course: courseCode
        }).toArray();
        return result.map((element) => {
            return this.convertDocumentToItem(element);
        }, []);
    }
}