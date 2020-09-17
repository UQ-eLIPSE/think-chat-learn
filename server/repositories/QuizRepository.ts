import { BaseRepository } from "./BaseRepository";
import { IQuiz } from "../../common/interfaces/DBSchema";
import * as mongodb from "mongodb";
export class QuizRepository extends BaseRepository<IQuiz>{

    // Note that availability is defined as startDate > Now > endDate
    public async findAvailableQuizInCourse(courseId: string) {
        return this.collection.findOne({
            course: courseId,
            availableStart: {
                $lt: new Date()
            },
            availableEnd: {
                $gt: new Date()
            }
        });
    }

    public async findAvailableQuizzesInCourse(courseId: string) {
        const availableQuizzes = await this.collection.find({
            course: courseId,
            availableStart: {
                $lt: new Date()
            },
            availableEnd: {
                $gt: new Date()
            }
        }).toArray();

        if(!availableQuizzes) return [];

        return (availableQuizzes || []).map((q) => this.convertDocumentToItem(q));
    }

    public async updateQuizMarksVisibility(quizScheduleId: string, marksPublic: boolean) {
        const response = await this.collection.findOneAndUpdate(
            {
                _id: new mongodb.ObjectID(quizScheduleId)
            },
            {
                $set: 
                    {
                        marksPublic: !!marksPublic
                    }
            }
        );

        return response && response.ok;
    }
}