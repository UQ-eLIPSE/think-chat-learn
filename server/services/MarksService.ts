import { BaseService } from "./BaseService";
import { QuizRepository } from "../repositories/QuizRepository";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { MarksRepository } from "../repositories/MarksRepository";


import { IQuiz, ElipssMark } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz } from "../../common/js/NetworkDataUtils";

export class MarksService extends BaseService {

    protected readonly quizRepo: QuizRepository;
    protected readonly quizSessionRepo: QuizSessionRepository;
    protected readonly marksRepo: MarksRepository;

    constructor(_marksRepo: MarksRepository, _quizRepo: QuizRepository, _quizSessionRepo: QuizSessionRepository) {
        super();
        this.quizRepo = _quizRepo;
        this.quizSessionRepo = _quizSessionRepo;
        this.marksRepo = _marksRepo;
    }

    public async getMarksForQuizSessionQuestion(quizSessionId: string, questionId?: string): Promise<ElipssMark[]> {
        console.log('Fetching marks by quiz session id and question id', {
            quizSessionId: quizSessionId,
            questionId: questionId
        });

        return this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId
        })
    }

    public async createOrUpdateMarks(quizSessionId: string, questionId: string, newMarks: ElipssMark): Promise<boolean> {
        const currentMarkerMarks = this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId
        });
        console.log('Current markers marks: ', currentMarkerMarks);
        if (currentMarkerMarks && Array.isArray(currentMarkerMarks)) {
            if (currentMarkerMarks.length > 1) {
                // TODO: Delete unwanted
                const deletePromises = await Promise.all(currentMarkerMarks.map(async (m) => {
                    await this.marksRepo.deleteOne(m._id);
                }));
                const res = await this.marksRepo.create(newMarks);
                if (res) return true;
                return false;
            } else {
                const currentMark = currentMarkerMarks[0];
                const currentMarkId = currentMark._id;
                return await this.marksRepo.updateOne(newMarks, currentMarkId);

            }
        } else {
            return false;
        }

    }

    public async createOrUpdateMarksMultiple(quizSessionId: string, questionId: string, newMarks: ElipssMark): Promise<boolean> {

        const currentMarkerMarks = await this.marksRepo.findAll({
            quizSessionId: quizSessionId,
            questionId: questionId,
            markerId: newMarks.markerId
        });
        console.log('In multi mkarking service', currentMarkerMarks);
        if (currentMarkerMarks && Array.isArray(currentMarkerMarks)) {
            if (currentMarkerMarks.length > 1) {
                // Error condition
                // TODO: Delete unwanted
                console.log('Deleting unwanted marks');
                const deletePromises = await Promise.all(currentMarkerMarks.filter(_ => _).map(async (m) => {
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
