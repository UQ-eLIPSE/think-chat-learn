import { BaseService } from "./BaseService";
import { UserRepository } from "../repositories/UserRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { LTIAuth } from "../js/auth/lti/LTIAuth";
import { IMoocchatIdentityInfo } from "../js/auth/IMoocchatIdentityInfo";
import { IUser, IQuiz, PageType } from "../../common/interfaces/DBSchema";
import { LoginResponse, IQuestionAnswerPage, IInfoPage } from "../../common/interfaces/ToClientData";

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

    // Returns just the user details for now
    public async handleAdminLogin(request: ILTIData): Promise<IUser> {
        // Get user+quiz info, check validity
        const identity = await UserServiceHelper.ProcessLtiObject(request);
        UserServiceHelper.CheckUserId(identity);

        const user = await UserServiceHelper.RetrieveUser(this.userRepo, identity);

        // TODO fix for active sesssions
        //             UserLoginFunc.CheckNoActiveSession(user);
        if (!identity.course) {
            throw new Error(`No course associated with identity`);
        }

        const adminRoles = [
            "instructor",
            "teachingassistant",
            "administrator",
        ];

        const isAdmin = (identity.roles || []).some(role => {
            return adminRoles.findIndex((element) => {
                return element === role.toLowerCase();
            }) !== -1;
        });

        if (!isAdmin) {
            throw new Error("Not an admin");
        }

        // TODO check for previous attempts and retrieve the questions associated with the selected quiz
        //await UserLoginFunc.CheckQuizNotPreviouslyAttempted(db, user, quizSchedule);

        return Promise.resolve(user);
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

    public static async RetrieveQuizSchedule(quizRepo: QuizRepository, course: string): Promise<IQuiz> {

        // Since the admin end points have not been made, return dummy values

        /*const quiz = await quizRepo.findAll({
            course
        });*/

        const sampleQuestion: IQuestionAnswerPage = {
            _id: "SampleQuestionId",
            type: PageType.QUESTION_ANSWER_PAGE,
            title: "Some Question Page",
            content: "Note there is no QuestionId linked yet",
            questionId: "123123"
        }

        const sampleInfo: IInfoPage = {
            _id: "SampleInfoPageId",
            type: PageType.INFO_PAGE,
            title: "Some Info Page",
            content: "Some form of content"
        }

        const quiz: IQuiz = {
            _id: "123123123",
            pages: [sampleInfo, sampleQuestion],
            course: "SomeSuperString",
            availableStart: new Date(Date.now() - 10000000),
            availableEnd: new Date(Date.now() + 1000000),
        }

        // TODO fix for active quizzes, currently retrieves just the quiz schedule for a particular course

        if (!quiz) {
            throw new Error("[30] No scheduled quiz found.");
        }

        return Promise.resolve(quiz);
    }

}