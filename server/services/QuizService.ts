import { BaseService } from "./BaseService";
import { QuizRepository } from "../repositories/QuizRepository";
import { IQuiz } from "../../common/interfaces/DBSchema";
import { ObjectId } from "bson";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz } from "../../common/js/NetworkDataUtils";
import { PageType } from "../../common/enums/DBEnums";
import { UserRepository } from "../repositories/UserRepository";

export class QuizService extends BaseService<IQuiz | IQuizOverNetwork> {

    protected readonly quizRepo: QuizRepository;
    protected readonly userRepo: UserRepository;

    constructor(_quizRepo: QuizRepository){
        super();
        this.quizRepo = _quizRepo;
    }

    // Creates a quiz in the DB based on the request body. 
    public async createOne(data: IQuizOverNetwork): Promise<string> {
        // Creates a new quiz based on the information, check for the existence of a discussion page.
        if (!data.pages) {
            throw new Error("No page from sent quiz");
        }

        this.validateQuiz(data);

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
    public async updateOne(data: IQuizOverNetwork): Promise<boolean> {
        // Updating is a little bit complicated due to the fact that
        // someone could theoretically push pages in and they wouldn't have ids

        if (!data.pages) {
            throw new Error("No page from sent quiz");
        }

        this.validateQuiz(data);

        if (data.pages.length) {
            data.pages.forEach((page) => {
                if (!page._id) {
                    page._id = (new ObjectId()).toHexString();
                }
            });
        }

        return this.quizRepo.updateOne(convertNetworkQuizIntoQuiz(data));
    }

    // Deletes a quiz based on the incoming id
    public async deleteOne(id: string) {
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

    /**
     * Fetch limited content of active/upcoming quizzes for a course
     * @param courseId Course code/context id e.g. ENGG1200_XXXX_XXXX
     * @param availability 'active' OR 'upcoming'
     * @param isAdmin Is requesting user an administrator
     */
    public async getActiveOrUpcomingQuizzesWithoutContent(courseId: string, availability: 'active' | 'upcoming', isAdmin?: boolean)
        : Promise<Omit<IQuiz, 'groupSize' | 'markingConfiguration' | 'rubricId' | 'pages'>[]> {
        
        // Query to filter all documents where isPublic is true, i.e. show all "public" quizzes
        const nonStaffQuery = { isPublic: true };
        
        // Check strict equality for administrator, not just truthiness
        const isUserAdministrator = isAdmin === true;

        const queryObject = Object.assign(
            {
                course: courseId
            },
            isUserAdministrator? {} : nonStaffQuery
        );

        const allQuizzesDocuments = await this.quizRepo.collection.find(queryObject).toArray();

        if(!allQuizzesDocuments || !Array.isArray(allQuizzesDocuments)) {
            console.error('Invalid active quizzes query');
            return [];
        }

        const allQuizzes = allQuizzesDocuments.map((q) => this.quizRepo.convertDocumentToItem(q));

        const now = new Date(Date.now());

        const activeQuizzes = allQuizzes.filter((quiz) => {
            if(!quiz.availableStart || !quiz.availableEnd) return false;
            try {
                const startDate = new Date(quiz.availableStart);
                const endDate = new Date(quiz.availableEnd);

                if(availability === 'active') {
                    return (now > startDate) && (now < endDate);
                }
                
                if(availability === 'upcoming') {
                    return startDate > now;
                }

                return false;
            } catch(e) {
                return false;
            }
        });

        const quizzesWithoutContent = activeQuizzes.map((activeQuiz) => {
            // Prevent leaking unnecessary information for active quizzes
            delete activeQuiz.groupSize;
            delete activeQuiz.markingConfiguration;
            delete activeQuiz.rubricId;
            delete activeQuiz.pages;

            return activeQuiz;
        });

        return quizzesWithoutContent;
    }

    public async findOne(quizId: string): Promise<IQuiz | null> {
        return this.quizRepo.findOne(quizId);
    }

    // Duplicated behaviour from the form validation used in the front-end
    private validateQuiz(maybeQuiz: IQuizOverNetwork) {
        // Check for falsy values
        if (!maybeQuiz.rubricId) {
            throw new Error("No rubric id");
        }

        if (!maybeQuiz.title) {
            throw new Error("No quiz title");
        }

        if (!maybeQuiz.availableEnd) {
            throw new Error("No provided end datetime");
        }

        if (!maybeQuiz.availableStart) {
            throw new Error("No provided start datetime");
        }

        if ((new Date(maybeQuiz.availableEnd).getTime()) < (new Date(maybeQuiz.availableStart)).getTime()) {
            throw new Error("Start stime is greater than end time");
        }

        const hasDiscussion = maybeQuiz.pages!.some((page) => {
            return page.type === PageType.DISCUSSION_PAGE;
        });

        if (!hasDiscussion) {
            throw new Error("No discussion page");
        }        

        // Count the discussion questions
        const discussionCheck = maybeQuiz.pages!.some((page) => {
            if (page.type === PageType.DISCUSSION_PAGE) {
                const questionTotal = maybeQuiz.pages!.reduce((count: number, otherPage) => {
                    if (otherPage.type === PageType.DISCUSSION_PAGE && page.questionId === otherPage.questionId) {
                        count = count + 1;
                    }

                    return count;
                }, 0);

                return questionTotal !== 1;
            }
            return false;
        });

        if (discussionCheck) {
            throw Error("Duplicate discussion questions");
        }

        // Count the question answer questions
        const questionCheck = maybeQuiz.pages!.some((page) => {
            if (page.type === PageType.QUESTION_ANSWER_PAGE) {
                const questionTotal = maybeQuiz.pages!.reduce((count: number, otherPage) => {
                    if (otherPage.type === PageType.QUESTION_ANSWER_PAGE && page.questionId === otherPage.questionId) {
                        count = count + 1;
                    }

                    return count;
                }, 0);

                return questionTotal !== 1;
            }
            return false;
        });

        if (questionCheck) {
            throw Error("Duplicate questions in the question answer pages");
        }        
    }
}