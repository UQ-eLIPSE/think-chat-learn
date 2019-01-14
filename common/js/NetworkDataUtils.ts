import { IQuizOverNetwork } from "../interfaces/NetworkData";
import { IQuiz } from "../interfaces/DBSchema";

export function convertNetworkQuizIntoQuiz(quiz: IQuizOverNetwork): IQuiz {
    const output: IQuiz = {
        _id: quiz._id,
        availableEnd: new Date(quiz.availableEnd!),
        availableStart: new Date(quiz.availableStart!),
        title: quiz.title,
        course: quiz.course,
        pages: quiz.pages
    };

    return output;
}

/**
 * Converts a quiz that is sent from the network to something usable by the client and server
 * @param quiz the quiz to be converted
 */
export function convertQuizIntoNetworkQuiz(quiz: IQuiz): IQuizOverNetwork {

    const output: IQuizOverNetwork = {
        _id: quiz._id,
        availableEnd: quiz.availableEnd!.toISOString(),
        availableStart: quiz.availableStart!.toISOString(),
        title: quiz.title,
        course: quiz.course,
        pages: quiz.pages
    };

    return output;
}

export function convertNetworkQuizzesIntoQuizzes(quizzes: IQuizOverNetwork[]): IQuiz[] {
    return quizzes.reduce((arr: IQuiz[], element) => {
        arr.push(convertNetworkQuizIntoQuiz(element));
        return arr;
    }, []);
}

export function convertQuizzesIntoNetworkQuizzes(quizzes: IQuiz[]): IQuizOverNetwork[] {
    return quizzes.reduce((arr: IQuizOverNetwork[], element) => {
        arr.push(convertQuizIntoNetworkQuiz(element));
        return arr;
    }, []);
}
