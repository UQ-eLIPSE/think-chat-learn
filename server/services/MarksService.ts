import { BaseService } from "./BaseService";
import { QuizRepository } from "../repositories/QuizRepository";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { ChatGroupRepository } from "../repositories/ChatGroupRepository";
import { MarksRepository } from "../repositories/MarksRepository";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { UserRepository } from "../repositories/UserRepository";


import { Mark } from "../../common/interfaces/DBSchema";
import { IUser, IQuiz, IQuizSession, IUserSession, IChatGroup } from "../../common/interfaces/ToClientData";
import { RubricRepository } from "../repositories/RubricRepository";
import { CriteriaRepository } from "../repositories/CriteriaRepository";

export class MarksService extends BaseService<Mark> {

    protected readonly quizRepo: QuizRepository;
    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly marksRepo: MarksRepository;
    protected readonly chatGroupRepo: ChatGroupRepository;
    protected readonly userSessionRepo: UserSessionRepository;
    protected readonly userRepo: UserRepository;
    protected readonly rubricRepo: RubricRepository;
    protected readonly criteriaRepo: CriteriaRepository;

    constructor(_marksRepo: MarksRepository, quizRepo: QuizRepository, _quizSessionRepo: QuizSessionRepository,
            chatGroupRepository: ChatGroupRepository, userSessionRepo: UserSessionRepository, userRepo: UserRepository,
            _rubricRepository: RubricRepository, _criteriaRepository: CriteriaRepository) {
        super();
        this.quizRepo = quizRepo;
        this.quizSessionRepo = _quizSessionRepo;
        this.marksRepo = _marksRepo;
        this.chatGroupRepo = chatGroupRepository;
        this.userRepo = userRepo;
        this.userSessionRepo = userSessionRepo;
        this.rubricRepo = _rubricRepository;
        this.criteriaRepo = _criteriaRepository;
    }

    // Quick fetchers for the rubric and criteria information
    private async generateEmptyMarks(quiz: IQuiz, quizSessionIds: string[],
        quizUserDict: {[key: string]: { userSessionId: string | null, user: IUser | null }},
        destinationDict: {[key: string]: Mark[]}) {
        // Acquire the rubric and criterias
        if (!quiz.rubricId) {
            throw new Error(`Invalid rubric id of quiz ${quiz._id}`);
        }

        const referredRubric = await this.rubricRepo.findOne({
            _id: quiz.rubricId
        });

        if (!referredRubric) {
            throw new Error(`No rubric found of id ${quiz.rubricId}`);
        }

        const referredCriteria = await this.criteriaRepo.findByIdArray(referredRubric.criterias);
        // Then populate the marks
        quizSessionIds.forEach((quizSessionId) => {
            const tempMark: Mark = {
                marks: [],
                feedback: "",
                quizSessionId,
                markerId: null,
                userId: quizUserDict[quizSessionId].user!._id,
                username: quizUserDict[quizSessionId].user!.username,
                markerUsername: undefined,
                timestamp: null,
                quizId: null,    
            }

            destinationDict[quizSessionId] = [tempMark];
        });
        return destinationDict;
    }

    // Basic CRUD implementations
    // Creates a criteria
    public async createOne(data: Mark): Promise<string> {

        return this.marksRepo.create(data);
    }

    // Simply an override to the existing criteria
    public async updateOne(data: Mark): Promise<boolean> {
        return this.marksRepo.updateOne(data);
    }

    // Deletes a criteria based on the id
    public async deleteOne(_id: string) {
        return this.marksRepo.deleteOne(_id);
    }

    // Gets a criteria based on id
    public async findOne(_id: string): Promise<Mark | null> {
        return this.marksRepo.findOne(_id);
    }

    public async getMarksForQuizSession(quizSessionId: string): Promise<Mark[]> {

        return this.marksRepo.findAll({
            quizSessionId: quizSessionId
        })
    }

    public async createOrUpdateMarks(quizSessionId: string, questionId: string, newMarks: Mark): Promise<boolean> {
        const currentMarkerMarks = await this.marksRepo.findAll({
            quizSessionId: quizSessionId
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

            let quizSessionMarkMap: { [quizSessionId: string]: Mark[] } = {};
            
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
                if (quizSessionMarkMap[mark.quizSessionId] === undefined) quizSessionMarkMap[mark.quizSessionId] = [];
                quizSessionMarkMap[mark.quizSessionId].push(mark);
            });
            
            const quizSessionUserMap = await this.getQuizSessionUserMap(quizSessionsToFetch);
            const fetchedQuizSessionIds = Object.keys(quizSessionMarkMap);
            const missingQuizSessionIds = quizSessionsToFetch.filter((quizSession) => {
                return !fetchedQuizSessionIds.find((fetchedId) => {
                    return fetchedId === quizSession;
                });
            });

            quizSessionMarkMap = await this.generateEmptyMarks(quiz, missingQuizSessionIds, quizSessionUserMap, quizSessionMarkMap);
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

    public async createOrUpdateMarksMultiple(quizSessionId: string, questionId: string, newMarks: Mark): Promise<boolean> {

        // Only need a quiz session + markerID combo to determine a mark
        const currentMarkerMarks = await this.marksRepo.findAll({
            quizSessionId: quizSessionId,
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

    private async _getChatGroupUserMap(chatGroup: IChatGroup) {
        const chatGroupId = chatGroup._id;
        if(!chatGroupId) {
            console.error('Chat group does not have an _id');
            return;
        }
        
        const chatGroupMap: { chatGroupId: string, quizSessions: IQuizSession[], userSessions: IUserSession[], users: IUser[]  } = { chatGroupId: chatGroupId, quizSessions: [], userSessions: [], users: []};

        if(!chatGroup.quizSessionIds || !Array.isArray(chatGroup.quizSessionIds)) return;
        const quizSessions = await this.quizSessionRepo.findByIdArray(chatGroup.quizSessionIds);
        if(quizSessions && Array.isArray(quizSessions)) {
            chatGroupMap.quizSessions = quizSessions;
        } else {
            console.error('Quiz sessions could not be fetched for chat group ', chatGroup._id);
            return;
        }

        const userSessionsIds = quizSessions.map((q) => q.userSessionId).filter((u) => u) as string[];
        const userSessions = await this.userSessionRepo.findByIdArray(userSessionsIds);

        if(userSessions && Array.isArray(userSessions)) {
            chatGroupMap.userSessions = userSessions;
        } else {
            console.error('User sessions could not be fetched for chat group ', chatGroup._id);
            return;
        }

        const userIds = userSessions.map((s) => s.userId).filter((u) => u) as string[];
        const users = await this.userRepo.findByIdArray(userIds);

        if(users && Array.isArray(users)) {
            chatGroupMap.users = users;
        } else {
            console.error('Users could not be fetched for chat group ', chatGroup._id);
            return;
        }

        return chatGroupMap;
    }

    private _getUsernameToChatGroupMap(data: { chatGroupId: string, quizSessions: IQuizSession[], userSessions: IUserSession[], users: IUser[]  }) {
        const chatGroupId = data.chatGroupId;

        data.quizSessions
    }

    // Gets the chat group based on the quiz id
    public async getChatGroupsUserMap(quizId: string): Promise<{ [username: string]: { quizSessionId: string, chatGroupId: string }[] } | null> {
        try {
            const chatGroups = await this.chatGroupRepo.findAll({
                quizId
            });

            if(!chatGroups || !Array.isArray(chatGroups)) throw new Error('Chat groups response invalid from database');

            if(!chatGroups.length) return {};

            const usernameToChatGroupMap: { [username: string]: { quizSessionId: string, chatGroupId: string }[] } = {};
            const chatGroupIdMap: {[chatGroupId: string]: { chatGroupId: string, quizSessions: IQuizSession[], userSessions: IUserSession[], users: IUser[]  }} = {};

            const chatGroupData = await Promise.all(chatGroups.map(async(chatGroup) => this._getChatGroupUserMap(chatGroup)));

            chatGroupData.filter(x => x).forEach((chatGroupDatum) => {
                chatGroupIdMap[chatGroupDatum!.chatGroupId] = chatGroupDatum!;
            });
            return usernameToChatGroupMap;
        } catch(e) {
            return null;
        }
         
    }



}
