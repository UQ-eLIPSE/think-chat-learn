import { BaseService } from "./BaseService";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { IQuizSession, Response, AttemptedQuizSessionData, TypeQuestion, IResponse } from "../../common/interfaces/DBSchema";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { ResponseRepository } from "../repositories/ResponseRepository";
import { Utils } from "../../common/js/Utils";
import { PageType } from "../../common/enums/DBEnums";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { ObjectID } from "mongodb";
import { IQuestionAnswerPage } from "../../common/interfaces/ToClientData";
import { UserRepository } from "../repositories/UserRepository";

export class QuizSessionService extends BaseService<IQuizSession> {

    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly quizRepo: QuizRepository;
    protected readonly userSessionRepo: UserSessionRepository;
    protected readonly responseRepo: ResponseRepository;
    protected readonly questionRepo: QuestionRepository;
    protected readonly userRepo: UserRepository;

    constructor(_quizSessionRepo: QuizSessionRepository, _userSessionRepo: UserSessionRepository,
        _quizRepo: QuizRepository, _responseRepo: ResponseRepository, _questionRepo: QuestionRepository, _userRepo: UserRepository) {

        super();

        this.quizSessionRepo = _quizSessionRepo;
        this.userSessionRepo = _userSessionRepo;
        this.quizRepo = _quizRepo;
        this.responseRepo = _responseRepo;
        this.questionRepo = _questionRepo;
        this.userRepo = _userRepo;
    }

    // Creates a user session assuming the body is valid
    public async createOne(data: IQuizSession): Promise<string> {
        const goodData = await this.checkQuizSession(data);
        const someQuizSession = await this.quizSessionRepo.findQuizSessionByUserId(data.userSessionId!);

        if (!goodData || someQuizSession) {
            throw Error("Invalid quiz session");
        }

        // When creating the quiz session, set the complete to false
        // as we only allow the value to be true from updates
        data.startTime = Date.now();
        data.complete = false;
        return this.quizSessionRepo.create(data);
    }

    // Simply an override. 
    public async updateOne(data: IQuizSession): Promise<boolean> {
        const goodData = await this.checkQuizSession(data);

        const maybeQuizSession = await this.quizSessionRepo.findOne(data._id!);

        if (!goodData || !maybeQuizSession || !(maybeQuizSession.quizId === data.quizId) ||
            !(maybeQuizSession.userSessionId === data.userSessionId)) {
            return false;
        }

        return this.quizSessionRepo.updateOne(data);
    }

    // Deletes a quiz based on the incoming id
    public async deleteOne(id: string) {
        return this.quizSessionRepo.deleteOne(id);
    }

    // Gets the quiz session based on quiz ids
    public async getQuizSessions(quizId: string): Promise<IQuizSession[]> {
        return this.quizSessionRepo.findAll({
            quizId
        });
    }

    // Gets the quiz session based on the id itself
    public async findOne(sessionId: string): Promise<IQuizSession | null> {
        return this.quizSessionRepo.findOne(sessionId);
    }

    // Determines if the packet can possibly form a good relationship
    private async checkQuizSession(data: IQuizSession) {
        if (!data.quizId || !data.userSessionId || !data.responses) {
            return false;
        }

        const checkQuiz = await this.quizRepo.findOne(data.quizId);
        const checkUserSession = await this.userSessionRepo.findOne(data.userSessionId);

        const responsePromises: Promise<Response | null>[] = [];
        data.responses.forEach((response) => {
            responsePromises.push(this.responseRepo.findOne(response));
        });
        const checkResponses = await Promise.all(responsePromises);

        if (!checkQuiz || !checkUserSession || !checkResponses ||
            (checkResponses.findIndex((element) => element === null) !== -1)) {
            return false;
        }

        return true;
    }

    // Gets the quiz session by the combination of userId and quizId
    public async getQuizSessionbyUserQuiz(userId: string, quizId: string): Promise<IQuizSession | null> {
        // Fetch all user the user sessions
        const usersessions = await this.userSessionRepo.findUserSessionsByUserId(userId);
        const quizSession = await this.quizSessionRepo.findQuizSessionByUserQuiz(
            usersessions.map((element) => { return element._id! }, []), quizId);
        return quizSession;
    }

    // Gets the quiz session by the combination of userId and course
    async getQuizSessionsByUserCourse(userId: string, courseCode: string): Promise<IQuizSession[]> {
        // Fetch all user the user sessions
        try {
            const usersessions = await this.userSessionRepo.findUserSessionsByUserCourse(userId, courseCode);
            const quizSessions = await this.quizSessionRepo.findQuizSessionsByUserSessions(
                (usersessions || []).map((element) => { return element._id! }, []));

            return quizSessions || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Returns past quiz attempts (quiz sessions) for a specified user and course
     * A session can be considered a 'past' session if either
     * * Quiz session has `complete` = true OR
     * * Current time > (Quiz end time + quiz duration)
     * @param userId 
     * @param courseCode 
     */
    async getPastQuizSessionsDataForUserCourse(userId: string, courseCode: string): Promise<AttemptedQuizSessionData[] | null> {
        const quizSessions = await this.getQuizSessionsByUserCourse(userId, courseCode);
        if (!quizSessions) return [];
        const quizSessionsQuizzes = await Promise.all(quizSessions.map(async (quizSession) => {
            const pastQuizSession: AttemptedQuizSessionData = Object.assign({}, quizSession);

            const quiz = await this.quizRepo.findOne(quizSession.quizId!);

            pastQuizSession.quiz = quiz || undefined;

            return pastQuizSession;
        }));
        if(!quizSessionsQuizzes || !quizSessionsQuizzes.length) return [];

        const pastQuizSessions = quizSessionsQuizzes.filter((quizSessionQuiz) => {
            if(quizSessionQuiz.complete) return true;

            const currentTime = Date.now();

            if(quizSessionQuiz && quizSessionQuiz.quiz && quizSessionQuiz.startTime &&
                quizSessionQuiz.quiz.pages) {

                const quizDuration = (quizSessionQuiz.quiz.pages || []).reduce(
                    // For some reason, `timeoutInMins` typings, system-wide are `number` but is actually a string in the database
                    // TODO: Investigate the actual type and usages of `timeoutInMins`
                    (totalTimeInMinutes, page) => totalTimeInMinutes + parseFloat(`${page.timeoutInMins || 0}`)
                , 0);

                // Expected end time of the quiz session is (quiz session start time) + (total quiz duration)
                const maxEndTime = Utils.DateTime.minToMs(quizDuration) + new Date(quizSessionQuiz.startTime!).getTime();

                return currentTime > maxEndTime;
            }
            
            return false;
        });

        // Populate responsesWithContent and questions
        await Promise.all(pastQuizSessions.map(async (session) => {
            const responseIds = session.responses || [];

            if (session && session.quiz && session.quiz.pages) {
                const validQuestionIds = (session.quiz.pages || [])
                    .filter((p) => p.type === PageType.QUESTION_ANSWER_PAGE).map((questionPage: IQuestionAnswerPage) => questionPage.questionId).filter((x) => !!x) as string[];

                const questions = await this.questionRepo.findByIdArray(validQuestionIds);
                session.questions = questions && questions.length? questions: []; 
            }

            if(responseIds && responseIds.length) {
                const responses = await this.responseRepo.findByIdArray(responseIds);
                session.responsesWithContent = responses && responses.length ? responses : [];
            }
        }));

        return pastQuizSessions;
    }

    /**
     * Used for searching quiz sessions by username
     * Returns payload of { quizSessionId: "(lowercase) <username>,<first name>,<last name>""}
     * @param quizScheduleId 
     */
    public async getQuizSessionUserMap(quizScheduleId: string): Promise<{ success: boolean, payload?: any, message?: string }> {
        try {
            const quizSessions = await this.quizSessionRepo.findQuizSessionsByQuizId(quizScheduleId);

            if(!quizSessions || !Array.isArray(quizSessions)) throw new Error("No valid quiz sessions found for quiz id");

            const userSessionIds = quizSessions.map((q) => q.userSessionId).filter((x) => x) as string[];

            const userSessions = await this.userSessionRepo.findByIdArray(userSessionIds);

            if(!userSessions || !Array.isArray(userSessions)) throw new Error("No valid user sessions found for quiz id");

            const userIds = userSessions.map((u) => u.userId).filter((x) => x) as string[];

            const users = await this.userRepo.findByIdArray(userIds);

            if(!users || !Array.isArray(users)) throw new Error("No valid users found for quiz id");

          
            const quizSessionUserMap = quizSessions.reduce((userMap, quizSession) => {
                if(userMap[quizSession._id as string]) return userMap;

                const userSessionId = quizSession.userSessionId;
                const userSession = userSessions.find((s) => s._id === userSessionId);
                if(!userSession) return userMap;
                const user = users.find((u) => u._id === userSession.userId);
                if(!user) return userMap;
                userMap[quizSession._id as string] = `${user?.username},${user.firstName},${user.lastName}`.toLowerCase();

                return userMap;
            }, {} as {[key: string]: string});

            return {
                success: true,
                payload: quizSessionUserMap
            };

        } catch(e) {
            return {
                success: false,
                message: e.message
            }
        }
    }
}