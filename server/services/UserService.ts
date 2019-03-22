import { BaseService } from "./BaseService";
import { UserRepository } from "../repositories/UserRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { LTIAuth } from "../js/auth/lti/LTIAuth";
import { IMoocchatIdentityInfo } from "../js/auth/IMoocchatIdentityInfo";
import { IUser, IQuiz } from "../../common/interfaces/DBSchema";
import { LoginResponse, AdminLoginResponse, QuizScheduleData, QuizScheduleDataAdmin, TypeQuestion, Page, QuestionRequestData, QuestionReconnectData } from "../../common/interfaces/ToClientData";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { convertQuizIntoNetworkQuiz } from "../../common/js/NetworkDataUtils";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { QuestionType, PageType } from "../../common/enums/DBEnums";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { ChatGroupRepository } from "../repositories/ChatGroupRepository";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { Utils } from "../../common/js/Utils";
import { Conf } from "../config/Conf";

export class UserService extends BaseService{

    protected readonly userRepo: UserRepository;
    protected readonly quizRepo: QuizRepository;
    protected readonly questionRepo: QuestionRepository;
    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly chatGroupRepo: ChatGroupRepository;
    protected readonly userSessionRepo: UserSessionRepository;


    constructor(_userRepo: UserRepository, _quizRepo: QuizRepository, _questionRepo: QuestionRepository, _chatGroupRepo: ChatGroupRepository,
        _quizSessionRepo: QuizSessionRepository, _userSessionRepo: UserSessionRepository){
        super();
        this.userRepo = _userRepo;
        this.quizRepo = _quizRepo;
        this.questionRepo = _questionRepo;
        this.chatGroupRepo = _chatGroupRepo;
        this.quizSessionRepo = _quizSessionRepo;
        this.userSessionRepo = _userSessionRepo;
    }

    public async handleLoginWrapper(request: ILTIData) {
            // Get user+quiz info, check validity
        const identity = UserServiceHelper.ProcessLtiObject(request);

        if(this.isLtiAdmin(identity)) {
            let html = `
                <html>
                    <form method="POST" action="/">`;
            
                    const inputString = Object.keys(request).reduce((str, k) => str + `<input type="hidden" name="${k}" value="${request[k]}" />`, ``);
                    
                    const rest = `
                        <input type="submit" value="Launch admin panel" formaction="/user/admin">
                        <input type="submit" value="Launch student view" formaction="/user/login">
                    </form>
                </html>
            `;
            return { isAdmin: true, html: html + inputString + rest };
        } else {
            return { isAdmin: false };
        }
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

        if (!request.custom_quizid) {
            throw new Error(`No quiz provided`);
        }

        // Fetching the quiz is done regardless. Whether or not they can create a quiz session is a different story
        const quizSchedule = await this.quizRepo.findOne(request.custom_quizid);

        if (!quizSchedule) {
            throw new Error(`No scheduled quiz available`)
        }


        // TODO check for previous attempts and retrieve the questions associated with the selected quiz
        //await UserLoginFunc.CheckQuizNotPreviouslyAttempted(db, user, quizSchedule);
        // Creating the list of ids requires a set
        const questionIds: string[] = [];

        quizSchedule.pages!.forEach((element) => {
            if (((element.type === PageType.QUESTION_ANSWER_PAGE) || (element.type === PageType.DISCUSSION_PAGE)) 
                && questionIds.findIndex((id) => { return id === element.questionId; }) === -1) {
                questionIds.push(element.questionId);
            }
        });
            
        const available = Date.now() >= quizSchedule!.availableStart!.getTime() &&
            quizSchedule.availableEnd!.getTime() >= Date.now() ? true : false;
        const questions = await UserServiceHelper.RetrieveQuestions(this.questionRepo, questionIds);

        const output: LoginResponse = {
            user,
            // quiz: quizSchedule ? convertQuizIntoNetworkQuiz(quizSchedule) : null,
            courseId: identity.course,
            // questions,
            quizId: quizSchedule && quizSchedule._id ? quizSchedule._id : null,
            available
        };

        return output;
    }

    public isLtiAdmin(identity: IMoocchatIdentityInfo) {
        try {
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

            return isAdmin;
        } catch (e) {
            return false;
        }
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

        // const adminRoles = [
        //     "instructor",
        //     "teachingassistant",
        //     "administrator",
        // ];

        // const isAdmin = (identity.roles || []).some(role => {
        //     return adminRoles.findIndex((element) => {
        //         return element === role.toLowerCase();
        //     }) !== -1;
        // });

        if (!this.isLtiAdmin(identity)) {
            throw new Error("Not an admin");
        }

        // TODO check for previous attempts and retrieve the questions associated with the selected quiz
        const quizzes = await this.quizRepo.findAll({ course: identity.course });
        const questions = await this.questionRepo.findAll({ courseId: identity.course });

        // The main distinguisher is that the token cannot be changed easily so by checking the isAdmin is
        // true should be good enough
        const output: AdminLoginResponse = {
            user,
            //quizzes: quizzes.reduce((arr: IQuizOverNetwork[], element) => 
            //    { arr.push(convertQuizIntoNetworkQuiz(element)); return arr; }, []),
            courseId: identity.course,
            //questions,
            isAdmin: true
        }


        return Promise.resolve(output);
    }

    // Simply returns a user if exist, null otherwise
    public async findUser(userId: string): Promise<IUser | null> {
        return UserServiceHelper.FindUser(this.userRepo, userId);
    }

    public async handlePageRequest(quizId: string, pageId: string, quizSessionId: string, groupId: string | null): Promise<QuestionRequestData | null> {
        return UserServiceHelper.getPageBasedOnIdsAndTime(quizId, pageId, quizSessionId, groupId, this.quizRepo,
            this.questionRepo, this.quizSessionRepo, this.chatGroupRepo);
    }

    public async handleReconnect(quizId: string, quizSessionId: string, groupId: string | null): Promise<QuestionReconnectData> {
        return UserServiceHelper.getQuizBasedOnTime(quizId, quizSessionId, groupId, this.quizRepo,
            this.questionRepo, this.quizSessionRepo, this.chatGroupRepo);
    }

    public async handleFetch(token: LoginResponse | AdminLoginResponse): Promise<QuizScheduleData | QuizScheduleDataAdmin | null> {
        if ((token as AdminLoginResponse).isAdmin) {
            const quizzes = await this.quizRepo.findAll({ course: token.courseId });
            const questions = await this.questionRepo.findAll({ courseId: token.courseId });

            const output: QuizScheduleDataAdmin = {
                questions,
                quizzes: quizzes.reduce((arr: IQuizOverNetwork[], element) => 
                { arr.push(convertQuizIntoNetworkQuiz(element)); return arr; }, []),                
            }

            return output;
        } else {

            const quizSchedule = await this.quizRepo.findOne((token as LoginResponse).quizId!);
            const questionIds: string[] = [];

            if (!quizSchedule) {
                throw Error("Invalid quiz");
            }

            quizSchedule.pages!.forEach((element) => {
                if (((element.type === PageType.QUESTION_ANSWER_PAGE) || (element.type === PageType.DISCUSSION_PAGE)) 
                    && questionIds.findIndex((id) => { return id === element.questionId; }) === -1) {
                    questionIds.push(element.questionId);
                }
            });
                            
            
            const questions = await UserServiceHelper.RetrieveQuestions(this.questionRepo, questionIds);
            // The great filter
            questions.forEach((element, index) => {
                // Title is fine to send over, content is not until it is requested
                if (index !== 0) {
                    delete element.content;
                }
            });

            quizSchedule.pages!.forEach((element, index) => {
                if (index !== 0) {
                    delete element.content;
                    delete element.timeoutInMins;
                }
            });

            const output: QuizScheduleData = {
                questions,
                quiz: quizSchedule ? convertQuizIntoNetworkQuiz(quizSchedule) : null,
            }

            return output;
        }
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
                    _id: maybeId,
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

    public static async FindUser(userRepo: UserRepository, id: string ): Promise<IUser | null> {
        return userRepo.findOne(id);
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

    public static async getQuizBasedOnTime(quizId: string, quizSessionId: string, groupId: string | null,
        quizRepo: QuizRepository, questionRepo: QuestionRepository, quizSessionRepo: QuizSessionRepository,
        chatGroupRepo: ChatGroupRepository): Promise<QuestionReconnectData> {

        const now = Date.now();

        const pages: Page[] = [];

        // Fetch the details
        const quiz = await quizRepo.findOne(quizId);
        const quizSession = await quizSessionRepo.findOne(quizSessionId);

        if (!quiz || !quizSession) {
            throw Error(`Invalid Quiz Id of ${quizId} or Quiz session Id of ${quizSession}`);
        }


        // Essentially what happens is that we need to check some times
        // the first check is to see what index we are up to based on time
        let firstDiscussionIndex = quiz.pages!.findIndex((element) => {
            return element.type == PageType.DISCUSSION_PAGE;
        });

        // Worst case we check every page due to not having a single discussion
        if (firstDiscussionIndex === -1) {
            firstDiscussionIndex = quiz.pages!.length;
        }

        let runningTime = quizSession.startTime!;
        for (let i = 0; i < firstDiscussionIndex; i++) {
            if (runningTime >= now + Conf.pageSlack) {
                break;
            } else {
                runningTime = runningTime + Utils.DateTime.minToMs(quiz.pages![i].timeoutInMins!);

                // We have a good page
                pages.push(quiz.pages![i]);
            }
        }

        // It is fine to have a non-existant group but we need to use the discussion index as a reference
        if (groupId) {
            const group = await chatGroupRepo.findOne(groupId);

            if (!group) {
                throw Error(`Invalid group id of ${groupId}`);
            }

            // Do the same thing with discussion page index except use the group formation as the reference
            let runningTime = group.startTime!;
            for (let i = firstDiscussionIndex; i < quiz.pages!.length; i++) {
                if (runningTime >= now + Conf.pageSlack) {
                    break;
                } else {
                    runningTime = runningTime + Utils.DateTime.minToMs(quiz.pages![i].timeoutInMins!);
    
                    // We have a good page
                    pages.push(quiz.pages![i]);
                }
            }
        }

        // From this point on we grab every single question associated with the pages
        const questionSet = new Set();
        pages.forEach((element) => {
            if ((element.type === PageType.QUESTION_ANSWER_PAGE) || (element.type === PageType.DISCUSSION_PAGE)) {
                // Fetch the question in the set
                questionSet.add(element.questionId);
            }
        });

        const questions = await questionRepo.findByIdArray(Array.from(questionSet));

        return { questions, pages };
    }

    
    public static async getPageBasedOnIdsAndTime(quizId: string, pageId: string, quizSessionId: string, groupId: string | null,
        quizRepo: QuizRepository, questionRepo: QuestionRepository, quizSessionRepo: QuizSessionRepository,
        chatGroupRepo: ChatGroupRepository): Promise<QuestionRequestData | null> {

        const now = Date.now();

        // Fetch the details
        const quiz = await quizRepo.findOne(quizId);
        const quizSession = await quizSessionRepo.findOne(quizSessionId);

        if (!quiz || !quizSession) {
            throw Error(`Invalid Quiz Id of ${quizId} or Quiz session Id of ${quizSession}`);
        }

        const desiredPageIndex = quiz.pages!.findIndex((element) => {
            return element._id === pageId;
        });

        const firstDiscussionIndex = quiz.pages!.findIndex((element) => {
            return element.type == PageType.DISCUSSION_PAGE;
        });

        // Somehow the page does not exist
        if (desiredPageIndex == -1) {
            throw Error(`Invalid pageId of ${pageId} or quiz id of ${quizId}`);
        }

        const desiredPage = quiz.pages![desiredPageIndex];

        let potentialQuestion = null;
        
        if ((desiredPage.type === PageType.QUESTION_ANSWER_PAGE) || (desiredPage.type === PageType.DISCUSSION_PAGE)) {
            potentialQuestion = await questionRepo.findOne(desiredPage.questionId);
        }

        // If the >= discussion page index (except when it is not there)
        let requireGroupId = false;
        if ((desiredPageIndex > firstDiscussionIndex) && (firstDiscussionIndex !== -1)) {
            requireGroupId = true;
        }

        if (requireGroupId && groupId) {
            const group = await chatGroupRepo.findOne(groupId);

            if (!group) {
                throw Error(`Invalid group id of ${groupId}`);
            }

            // Check if the amount of time is good
            const timeNeeded = quiz.pages!.slice(firstDiscussionIndex, desiredPageIndex).reduce((time, page) => {
                time = time + Utils.DateTime.minToMs(page.timeoutInMins);
                return time;
            }, 0);
    
            if (now + Conf.pageSlack >= group.startTime! + timeNeeded) {
                // Return the page
                return { page: desiredPage, question: potentialQuestion };
            }

        } else if (requireGroupId && !groupId) {
            throw Error(`Attempted to fetch page of id ${pageId} without a groupId`);
        } else {

            // Otherwise check the time
            const timeNeeded = quiz.pages!.slice(0, desiredPageIndex).reduce((time, page) => {
                time = time + Utils.DateTime.minToMs(page.timeoutInMins);
                return time;
            }, 0);
    
            if (now + Conf.pageSlack >= quizSession.startTime! + timeNeeded) {
                // Return the page
                return { page: desiredPage, question: potentialQuestion };
            }
        }

        return null;
    }
}