import { BaseService } from "./BaseService";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { IUserSession } from "../../common/interfaces/DBSchema";

export class UserSessionService extends BaseService{

    protected readonly userSessionRepo: UserSessionRepository;

    constructor(_userSessionRepo: UserSessionRepository){
        super();
        this.userSessionRepo = _userSessionRepo;
}

    // Creates a user session assuming the body is valid
    public async createUserSession(data: IUserSession): Promise<string> {

        return this.userSessionRepo.create(data);
    }

    // Simply an override. 
    public async updateUserSession(data: IUserSession): Promise<boolean> {
        // Don't update if the user id has changed
        const maybeUserSession = await this.userSessionRepo.findOne(data._id!);
        if (maybeUserSession && maybeUserSession.userId === data.userId) {
            return this.userSessionRepo.updateOne(data);
        }

        return false;

    }

    // Deletes a quiz based on the incoming id
    public async deleteUserSession(id: string) {
        return this.userSessionRepo.deleteOne(id);
    }

    // Gets the quiz based on course details. Admins should not even have the ability to see other courses
    // This would be based 
    // TODO implement the appropiate middleware to authenticate. Although we feed in the courseId
    // all references should be safe. 
    public async getUserSessions(courseId: string): Promise<IUserSession[]> {
        return this.userSessionRepo.findAll({
            course: courseId
        });
    }
}