import * as DBSchema from "./DBSchema";

type OID = string;
type Date = string;

// DB schema related
export type ChatMessage = DBSchema.ChatMessage<OID, Date>;
export type ChatGroup = DBSchema.ChatGroup<OID>;

export type Question = DBSchema.Question<OID>;
export type QuestionOption = DBSchema.QuestionOption<OID>;
export type QuestionOptionCorrect = DBSchema.QuestionOptionCorrect<OID>;
export type QuestionResponse = DBSchema.QuestionResponse<OID, Date>;

export type QuizSchedule = DBSchema.QuizSchedule<OID, Date>;
export type QuizAttempt = DBSchema.QuizAttempt<OID>;

export type Survey = DBSchema.Survey<OID, Date>;
export type Survey_Content = DBSchema.Survey_Content;
export type Survey_Content_Heading = DBSchema.Survey_Content_Heading;
export type Survey_Content_TextShort = DBSchema.Survey_Content_TextShort;
export type Survey_Content_MultipleChoiceInline = DBSchema.Survey_Content_MultipleChoiceInline;
export type Survey_Content_MultipleChoiceList = DBSchema.Survey_Content_MultipleChoiceList;

export type User = DBSchema.User<OID>;
export type UserSession = DBSchema.UserSession<OID, Date>;

export type Mark = DBSchema.Mark<OID, Date>;
export type SystemChatPromptStatement = DBSchema.SystemChatPromptStatement;


/** Deepconcepts remake */
export type IUser = DBSchema.IUser;
export type IQuizSchedule = DBSchema.IQuizSchedule;
export type IQuiz = DBSchema.IQuiz;
export type IQuestion = DBSchema.IQuestion;
export type IPage = DBSchema.IPage;
export type IInfoPage = DBSchema.IInfoPage;
export type ISurveyPage = DBSchema.ISurveyPage;
export type IQuestionAnswerPage = DBSchema.IQuestionAnswerPage;
export type IDiscussionPage = DBSchema.IDiscussionPage;

// API specific
export interface Quiz {
    question: Question;
    questionOptions: QuestionOption[];
    quizSchedule: QuizSchedule;
}

export interface QuizAttempt_User extends QuizAttempt {
    _user: User;
}

// Essentially the user should only have one page
export interface LoginResponse {
    user: IUser;
    quiz: IQuiz;
    courseId: string;
}

// Also handles the initial retrieval
export interface AdminLoginResponse {
    user: IUser;
    quizzes: IQuiz[];
    questions: IQuestion[];
    courseId: string;
}
