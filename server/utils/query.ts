export const Query: IQuery = {
    quizId: "123123123",
    questionIds: ["123123123"],
    course: "some course"
}


/**
 * Explicit definition for above query
 */
interface IQuery {
    quizId: string,
    questionIds: string[],
    course: string
}