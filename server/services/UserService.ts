import { BaseService } from "./BaseService";
import { UserRepository } from "../repositories/UserRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { LTIAuth } from "../js/auth/lti/LTIAuth";
import { IMoocchatIdentityInfo } from "../js/auth/IMoocchatIdentityInfo";
import { IUser, IQuizSchedule } from "../../common/interfaces/DBSchema";
import { LoginResponse } from "../../common/interfaces/ToClientData";

export class UserService extends BaseService{

    protected readonly userRepo: UserRepository;
    protected readonly quizRepo: QuizRepository;

    constructor(_userRepo: UserRepository, _quizRepo: QuizRepository){
        super();
        this.userRepo = _userRepo;
        this.quizRepo = _quizRepo;
    }

    public async handleLogin(request: ILTIData): Promise<LoginResponse> {
        // Get user+quiz info, check validity
        const identity = await UserServiceHelper.ProcessLtiObject(request);
        UserServiceHelper.CheckUserId(identity);

        const user = await UserServiceHelper.RetrieveUser(this.userRepo, identity);

        // TODO fix for active sesssions
        //             UserLoginFunc.CheckNoActiveSession(user);
        if (!identity.course) {
            throw new Error(`No course associated with identity`);
        }
        const quizSchedule = await UserServiceHelper.RetrieveQuizSchedule(this.quizRepo, identity.course);

        // TODO check for previous attempts and retrieve the questions associated with the selected quiz
        //await UserLoginFunc.CheckQuizNotPreviouslyAttempted(db, user, quizSchedule);

        const output: LoginResponse = {
            user,
            quiz: quizSchedule
        };

        return Promise.resolve(output);
    }
}

// Helper functions for the service
class UserServiceHelper {
    // Processes the LTI object to be user friendly
    public static async ProcessLtiObject(loginData: ILTIData) {
        const ltiAuth = new LTIAuth(loginData);

        const authResult = ltiAuth.authenticate();

        if (!authResult.success) {
            throw new Error(authResult.message);
        }

        return ltiAuth.getIdentity();
    }

    // Checks the existence of the id
    public static CheckUserId(identity: IMoocchatIdentityInfo) {
        if (!identity.identityId) {
            throw new Error("[10] No user ID received.");
        }
    }

    // Gets the user from the DB based on id
    public static async RetrieveUser(userRepo: UserRepository, identity: IMoocchatIdentityInfo): Promise<IUser> {
        
        const user = await userRepo.findOne({
            username: identity.identityId
        });

        if(!user) {
            throw Error("No such user");
        }

        return Promise.resolve(user);
    }

    public static async RetrieveQuizSchedule(quizRepo: QuizRepository, course: string): Promise<IQuizSchedule> {
        const quiz = await quizRepo.findAll({
            course
        });

        // TODO fix for active quizzes, currently retrieves just the quiz schedule for a particular course

        if (!quiz) {
            throw new Error("[30] No scheduled quiz found.");
        }

        return Promise.resolve(quiz[0]);
    }    
}