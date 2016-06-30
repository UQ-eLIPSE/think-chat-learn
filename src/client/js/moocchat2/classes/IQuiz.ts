/**
 * MOOCchat
 * Quiz interface
 * 
 * Encodes the expected quiz data from the server.
 */
export interface IQuiz {
    questionGroup: number;
    questionNumber: number;
    probingQuestionOldNumber: number;

    reading: string;

    probingQuestion: string;
    probingQuestionChoices: string[];
    probingQuestionAnswer: number;
    explanation: string;

    evaluationOldNumber: number;
    evaluationReading: string;
    evaluationQuestion: string;
    evaluationChoices: string[];
    evaluationAnswer: number;
    evalExplanation: string;

    stageDurations: number[];

    maxChoiceForStudentGenerateQuestion: number;

    crCategory: string;
}
