import {IQuiz} from "./IQuiz";

/*
 * MOOCchat
 * Quiz class module
 * 
 * Wraps around the quiz data that is returned from the server
 */

export class MoocchatQuiz {
    private data: IQuiz;

    constructor(data: IQuiz) {
        this.data = data;
    }

    public get questionNumber() {
        return this.data.questionNumber;
    }

    public get questionReading() {
        return this.data.reading;
    }

    public get questionStatement() {
        return this.data.probingQuestion;
    }

    public get questionChoices() {
        return this.data.probingQuestionChoices;
    }
}
