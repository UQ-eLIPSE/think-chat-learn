import {IQuiz} from "./IQuiz";

/**
 * MOOCchat
 * Quiz class module
 * 
 * Wraps around the quiz data that is returned from the server
 */
export class MoocchatQuiz {
    private data: IQuiz;

    /**
     * @param {IQuiz} data The quiz data returned from the server when first logging in
     */
    constructor(data: IQuiz) {
        this.data = data;
    }

    // public get questionNumber() {
    //     return this.data.questionNumber;
    // }

    // public get questionReading() {
    //     return this.data.reading;
    // }

    // public get questionStatement() {
    //     return this.data.probingQuestion;
    // }

    public get questionId() {
        return this.data.question._id;
    }

    public get questionContent() {
        return this.data.question.content;
    }

    public get questionChoices() {
        return this.data.questionOptions;
    }
}
