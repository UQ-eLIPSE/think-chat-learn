import { BaseService } from "./BaseService";
import { QuizRepository } from "../repositories/QuizRepository";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { ChatGroupRepository } from "../repositories/ChatGroupRepository";
import { MarksRepository } from "../repositories/MarksRepository";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { UserRepository } from "../repositories/UserRepository";


import { IQuiz, ElipssMark, Mark } from "../../common/interfaces/DBSchema";
import { ObjectId, ObjectID } from "bson";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz } from "../../common/js/NetworkDataUtils";
import { PageType } from "../../common/enums/DBEnums";
import { IQuestionAnswerPage, IUserSession, IUser } from "../../common/interfaces/ToClientData";

export class MarksService extends BaseService {

    protected readonly quizRepo: QuizRepository;
    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly marksRepo: MarksRepository;
    protected readonly chatGroupRepo: ChatGroupRepository;
    protected readonly userSessionRepo: UserSessionRepository;
    protected readonly userRepo: UserRepository;


    constructor(_marksRepo: MarksRepository, quizRepo: QuizRepository, _quizSessionRepo: QuizSessionRepository, chatGroupRepository: ChatGroupRepository, userSessionRepo: UserSessionRepository, userRepo: UserRepository) {
        super();
        this.quizRepo = quizRepo;
        this.quizSessionRepo = _quizSessionRepo;
        this.marksRepo = _marksRepo;
        this.chatGroupRepo = chatGroupRepository;
        this.userRepo = userRepo;
        this.userSessionRepo = userSessionRepo;
    }

    public async getMarksForQuizSessionQuestion(quizSessionId: string, questionId: string): Promise<Mark[]> {

        return this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId
        })
    }

    public async getMarksForQuizSession(quizSessionId: string): Promise<Mark[]> {

        return this.marksRepo.findAll({
            quizSessionId: quizSessionId
        })
    }

    public async createOrUpdateMarks(quizSessionId: string, questionId: string, newMarks: ElipssMark): Promise<boolean> {
        const currentMarkerMarks = await this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId
        });
        if (currentMarkerMarks && Array.isArray(currentMarkerMarks)) {
            if (currentMarkerMarks.length > 1) {
                // Delete unwanted / invalidated marks
                await Promise.all(currentMarkerMarks.map(async (m) => {
                    await this.marksRepo.deleteOne(m._id!);
                }));
                const res = await this.marksRepo.create(newMarks);
                if (res) return true;
                return false;
            } else if (currentMarkerMarks.length === 0) {
                // Mark does not exist, create
                const created = await this.marksRepo.create(newMarks);
                return created ? true : false;
            } else {
                // Single mark exists, update mark
                const currentMark = currentMarkerMarks[0];
                const currentMarkId = currentMark._id;
                return await this.marksRepo.updateOne(newMarks, currentMarkId);

            }
        } else {
            return false;
        }

    }
    async getDistinctQuizSessionForQuiz(quizId: string) {
        return await this.chatGroupRepo.collection.distinct("quizSessionIds", {
            quizId: quizId
        });
    }
    public async getMarksForQuizPaginated(quizId: string, currentPage: number, perPage: number) {


            const quiz = await this.quizRepo.findOne(quizId);
            if(!quiz) throw new Error("Quiz could not be found");
            const questionPages = (quiz.pages|| []).filter((p) => p.type === PageType.QUESTION_ANSWER_PAGE);
            const questionIds = questionPages.map((p: IQuestionAnswerPage) => p.questionId).filter((q) => q);


            const quizSessionMarkMap: { [quizSessionId: string]: { [questionId: string]: Mark[] } } = {};
            
            const quizSessionIds: string[] = await this.getDistinctQuizSessionForQuiz(quizId);


            const total = quizSessionIds.length;
            const start = currentPage ? (currentPage - 1) * perPage : 0;
            const end = currentPage * perPage;
            const quizSessionsToFetch = quizSessionIds.slice(start, end >= total ? total : end);
            
            const marksToFetch = await this.marksRepo.collection.find({
                quizSessionId: {
                    $in: (quizSessionsToFetch || [])
                },
            }).toArray();

            (marksToFetch || []).forEach((mark) => {
                if (quizSessionMarkMap[mark.quizSessionId] === undefined) quizSessionMarkMap[mark.quizSessionId] = {};
                if(quizSessionMarkMap[mark.quizSessionId][mark.questionId] === undefined) quizSessionMarkMap[mark.quizSessionId][mark.questionId] = [];
                quizSessionMarkMap[mark.quizSessionId][mark.questionId].push(mark);
            });


            quizSessionsToFetch.forEach((qs) => {
                questionIds.forEach((questionId) => {
                    if(quizSessionMarkMap[qs] === undefined) quizSessionMarkMap[qs] = {};
                    if(quizSessionMarkMap[qs][questionId] === undefined) {
                        quizSessionMarkMap[qs][questionId] = [];
                    }
                    
                })
            })
            
            const quizSessionUserMap = await this.getQuizSessionUserMap(quizSessionsToFetch);
            return { totalQuizSessions: total, marksMap: quizSessionMarkMap, quizSessionUserMap: quizSessionUserMap || null };
    }

    public async getQuizSessionUserMap(quizSessionIds: string[]) {
        const quizSessionMap: {[quizSessionId: string]: {
            userSessionId: string | null,
            user: IUser | null
        }} = {}
        const quizSessions = await this.quizSessionRepo.findByIdArray(quizSessionIds);

        quizSessions.filter(q => q.userSessionId).forEach((s) => {
            if(quizSessionMap[s._id!] === undefined) quizSessionMap[s._id!] = { userSessionId: null, user: null};
            quizSessionMap[s._id!].userSessionId = s.userSessionId!;
        });



        const userSessionIds = quizSessions.filter(q => q.userSessionId).map((s) => s.userSessionId!)
        const userSessions = await this.userSessionRepo.findByIdArray(userSessionIds);
        const userIds = await userSessions.filter((s) => s.userId).map((x) => x.userId!);
        const users = await this.userRepo.findByIdArray(userIds);

        Object.keys(quizSessionMap).forEach((quizSessionId) => {
            const userSession = userSessions.find((s) => s._id! === quizSessionMap[quizSessionId].userSessionId) || null;
            if(!userSession) return;
            const user = users.find((u) => u._id! === userSession.userId!) || null;
            if(!user) return;
            quizSessionMap[quizSessionId].user = user;
        });

        return quizSessionMap;
    }
    public async getMarksForQuiz(quizId: string) {
        try {
            const quizSessionMarkMap: { [quizSessionId: string]: Mark[] } = {};
            const chatGroups = await this.chatGroupRepo.findAll({
                quizId
            });

            await Promise.all(chatGroups.map(async (group) => {

                const quizSessionMarks = await this.marksRepo.collection.find({
                    quizSessionId: {
                        $in: (group.quizSessionIds || [])
                    }
                }).toArray();

                quizSessionMarks.forEach((mark) => {
                    if (quizSessionMarkMap[mark.quizSessionId] === undefined) quizSessionMarkMap[mark.quizSessionId] = [];
                    quizSessionMarkMap[mark.quizSessionId].push(mark);
                })
            }));



            return quizSessionMarkMap;

        } catch (e) {
            return null;
        }
    }
    public async createOrUpdateMarksMultiple(quizSessionId: string, questionId: string, newMarks: ElipssMark): Promise<boolean> {

        const currentMarkerMarks = await this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId,
            markerId: newMarks.markerId
        });
        if (currentMarkerMarks && Array.isArray(currentMarkerMarks)) {
            if (currentMarkerMarks.length > 1) {
                // Error condition
                // Delete unwanted / invalidated marks
                await Promise.all(currentMarkerMarks.filter(_ => _).map(async (m) => {
                    await this.marksRepo.deleteOne(m._id!);
                }));
                const res = await this.marksRepo.create(newMarks);
                if (res) return true;
                return false;
            } else if (currentMarkerMarks.length === 1) {
                // Update
                const currentMark = currentMarkerMarks[0];
                const currentMarkId = currentMark._id;
                return await this.marksRepo.updateOne(newMarks, currentMarkId);

            } else if (currentMarkerMarks.length === 0) {
                // Does not exist, create
                const created = await this.marksRepo.create(newMarks);
                return created ? true : false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
