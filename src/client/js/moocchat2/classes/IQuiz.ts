/*
 * MOOCchat
 * Quiz interfaces
 * 
 * Encodes the expected quiz data from the server.
 */

export interface IQuiz {
    question: IQuizQuestion;
    questionOptions:IQuizQuestionOption[];
    quizSchedule: IQuizSchedule;
}

export interface IQuizQuestion {
    _id?: string;
    content: string;
}

export interface IQuizQuestionOption {
    _id?: string;
    questionId: string;
    content: string;
    sequence: number;
}

export interface IQuizSchedule {
    _id?: string;
    questionId: string;
    availableStart: string;
    availableEnd: string;
    course: string;
}
