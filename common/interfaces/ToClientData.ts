import * as DBSchema from "./DBSchema";
import * as NetworkData from "./NetworkData";

/** Deepconcepts remake */
export type IUser = DBSchema.IUser;
export type IQuizSchedule = DBSchema.IQuizSchedule;
export type IQuiz = DBSchema.IQuiz;
export type IQuestion = DBSchema.IQuestion;
export type IPage = DBSchema.IPage;
export type IInfoPage = DBSchema.IInfoPage;
export type ISurveyPage = DBSchema.ISurveyPage;
export type TypeQuestion = DBSchema.TypeQuestion;
export type Page = DBSchema.Page;
export type IQuestionMCQ = DBSchema.IQuestionMCQ;
export type IQuestionQualitative = DBSchema.IQuestionQualitative;
export type IQuestionOption = DBSchema.IQuestionOption;
export type IQuestionAnswerPage = DBSchema.IQuestionAnswerPage;
export type IDiscussionPage = DBSchema.IDiscussionPage;
export type IUserSession = DBSchema.IUserSession;
export type IQuizSession = DBSchema.IQuizSession;
export type IChatGroup = DBSchema.IChatGroup;
export type Response = DBSchema.Response;
// API specific

// Essentially the user should only have one page
export interface LoginResponse {
  user: IUser;
  quiz: NetworkData.IQuizOverNetwork | null;
  questions: TypeQuestion[];
  courseId: string;
  available: boolean;
}

// Also handles the initial retrieval
export interface AdminLoginResponse {
  user: IUser;
  quizzes: NetworkData.IQuizOverNetwork[];
  questions: IQuestion[];
  courseId: string;
}
