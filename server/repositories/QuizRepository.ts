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
}