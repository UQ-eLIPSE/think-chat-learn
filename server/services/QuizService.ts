import { BaseService } from "./BaseService";
import { QuizRepository } from "../repositories/QuizRepository";
import { IQuiz } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz } from "../../common/js/NetworkDataUtils";

export class QuizService extends BaseService{

    protected readonly quizRepo: QuizRepository;

    constructor(_quizRepo: QuizRepository){
        super();
        this.quizRepo = _quizRepo;
}

    // Creates a quiz in the DB based on the request body. Assumes the request body is valid
    public async createQuiz(data: IQuizOverNetwork): Promise<string> {
        // Creates a new quiz based on the information.

        // Note we create ids for each page associated at the same time
        // The create operation returns the id as well
        if (data.pages && data.pages.length) {
            data.pages.forEach((page) => {
                page._id = (new ObjectId()).toHexString();
            });
        } else {
            throw Error("Missing pages or pages are empty");
        }

        return this.quizRepo.create(convertNetworkQuizIntoQuiz(data));
    }

    // You can think of it as a replacement based on the _id
    // Returns true if the operation succeed
    // Note that deleting a question can be thought as updating a question
    public async updateQuiz(data: IQuizOverNetwork): Promise<boolean> {
        // Updating is a little bit complicated due to the fact that
        // someone could theoretically push pages in and they wouldn't have ids

        if (data.pages && data.pages.length) {
            data.pages.forEach((page) => {
                if (!page._id) {
                    page._id = (new ObjectId()).toHexString();
                }
            });
        }

        return this.quizRepo.updateOne(convertNetworkQuizIntoQuiz(data));
    }

    // Deletes a quiz based on the incoming id
    public async deleteQuiz(id: string) {
        return this.quizRepo.deleteOne(id);
    }

    // Gets the quiz based on course details. Admins should not even have the ability to see other courses
    // This would be based 
    // TODO implement the appropiate middleware to authenticate. Although we feed in the courseId
    // all references should be safe. 
    public async getQuizzes(courseId: string): Promise<IQuiz[]> {
        return this.quizRepo.findAll({
            course: courseId
        });
    }

    public async getQuizQuestionById(quizId: string): Promise<IQuiz | null> {
        return this.quizRepo.findOne(quizId);
    }
}

// Helper functions for the service
class QuizServiceHelper {

}