import { BaseService } from "./BaseService";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { IUserSession } from "../../common/interfaces/DBSchema";
import { LoginResponse } from "../../common/interfaces/ToClientData";

export class UserSessionService extends BaseService<IUserSession> {

    protected readonly userSessionRepo: UserSessionRepository;

    constructor(_userSessionRepo: UserSessionRepository){
        super();
        this.userSessionRepo = _userSessionRepo;
}

    // Creates a user session assuming the body is valid
    public async createOne(data: IUserSession): Promise<string> {
        return this.userSessionRepo.create(data);
    }

    // Simply an override. 
    public async updateOne(data: IUserSession): Promise<boolean> {
        // Don't update if the user id has changed also don't let admin things (which pretty much does nothing)
        // change
        const maybeUserSession = await this.userSessionRepo.findOne(data._id!);
        if (maybeUserSession && maybeUserSession.userId === data.userId && maybeUserSession.role === data.role) {
            return this.userSessionRepo.updateOne(data);
        } else {
            throw Error("Invalid user session");
        }
    }

    // Deletes a quiz based on the incoming id
    public async deleteOne(id: string) {
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

    // Gets the user session simply based on id
    public async findOne(id: string): Promise<IUserSession | null> {
        return this.userSessionRepo.findOne(id);
    }
}