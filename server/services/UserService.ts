import { BaseService } from "./BaseService";
import { UserRepository } from "../repositories/UserRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { LTIAuth } from "../js/auth/lti/LTIAuth";
import { IMoocchatIdentityInfo } from "../js/auth/IMoocchatIdentityInfo";
import { IUser, IQuiz } from "../../common/interfaces/DBSchema";
import { LoginResponse, IQuestionAnswerPage, IInfoPage, AdminLoginResponse } from "../../common/interfaces/ToClientData";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { convertNetworkQuizIntoQuiz, convertQuizIntoNetworkQuiz } from "../../common/js/NetworkDataUtils";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { QuestionType, PageType } from "../../common/enums/DBEnums";

export class UserService extends BaseService{

    protected readonly userRepo: UserRepository;
    protected readonly quizRepo: QuizRepository;
    protected readonly questionRepo: QuestionRepository;

    constructor(_userRepo: UserRepository, _quizRepo: QuizRepository, _questionRepo: QuestionRepository){
        super();
        this.userRepo = _userRepo;
        this.quizRepo = _quizRepo;
        this.questionRepo = _questionRepo;
    }

    public async handleLogin(request: ILTIData): Promise<LoginResponse> {
        // Get user+quiz info, check validity
        const identity = UserServiceHelper.ProcessLtiObject(request);
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
        // Creating the list of ids requires a set
        const questionIds: string[] = [];

        if (quizSchedule) {
            quizSchedule.pages!.forEach((element) => {
                if ((element.type === PageType.QUESTION_ANSWER_PAGE) 
                    && questionIds.findIndex((id) => { return id === element.questionId; }) === -1) {
                    questionIds.push(element.questionId);
                }
            });
        }

        const questions = await UserServiceHelper.RetrieveQuestions(this.questionRepo, questionIds);

        const output: LoginResponse = {
            user,
            quiz: quizSchedule ? convertQuizIntoNetworkQuiz(quizSchedule) : null,
            courseId: identity.course,
            questions
        };

        return output;
    }

    // Returns just the user details for now
    public async handleAdminLogin(request: ILTIData): Promise<AdminLoginResponse> {
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
        const quizzes = await this.quizRepo.findAll({ course: identity.course });
        const questions = await this.questionRepo.findAll({ courseId: identity.course });

        const output: AdminLoginResponse = {
            user,
            quizzes: quizzes.reduce((arr: IQuizOverNetwork[], element) => 
                { arr.push(convertQuizIntoNetworkQuiz(element)); return arr; }, []),
            courseId: identity.course,
            questions
        }


        return Promise.resolve(output);
    }    
}

// Helper functions for the service
class UserServiceHelper {
    // Processes the LTI object to be user friendly
    public static ProcessLtiObject(loginData: ILTIData) {
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
        
        let user = await userRepo.findOne({
            username: identity.identityId
        });

        // Create a new user
        if(!user) {
            const maybeId = await userRepo.create({
                username: identity.identityId,
                firstName: identity.name.given,
                lastName: identity.name.family,
                researchConsent: false
            });

            if (maybeId) {
                user = {
                    username: identity.identityId,
                    firstName: identity.name.given,
                    lastName: identity.name.family,
                    researchConsent: false
                };
            } else {
                throw Error("Failed to create new user");
            }
        }

        return Promise.resolve(user);
    }

    /**
     * Retrieves a quiz that can be done within a course. Returns null if no such quiz is available
     * @param quizRepo The repo which points to the DB
     * @param course The course id
     */
    public static async RetrieveQuizSchedule(quizRepo: QuizRepository, course: string): Promise<IQuiz | null> {
        const quiz = await quizRepo.findAvailableQuizInCourse(course);
        
        return Promise.resolve(quiz);
    }

    /**
     * Grabs the questions from an associated quiz. If a question is MCQ, strips the isCorrect field
     * @param questionRepo The repo containing the questions

     */
    public static async RetrieveQuestions(questionRepo: QuestionRepository, questionIds: string[]) {
        const questions = await questionRepo.findByIdArray(questionIds);

        if (!questions) {
            return [];
        }

        questions.forEach((element) => {
            if (element.type === QuestionType.MCQ) {
                element.options.forEach((option) => {
                    delete option.isCorrect;
                });
            }
        });

        return questions;
    }
}