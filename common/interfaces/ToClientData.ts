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
export type ICriteria = DBSchema.ICriteria;
export type IRubric = DBSchema.IRubric;
export type Response = DBSchema.Response;
// API specific

// Essentially the user should only have one page
export interface LoginResponse {
  user: IUser;
  courseId: string;
  quizId: string | null;
  available: boolean;
}

export interface QuizScheduleData {
  quiz: NetworkData.IQuizOverNetwork | null;
  questions: TypeQuestion[];
}

// Handles what to send back for the admin page
export interface QuizScheduleDataAdmin {
  quizzes: NetworkData.IQuizOverNetwork[];
  questions: TypeQuestion[];
  criterias: ICriteria[];
  rubrics: IRubric[];
}

// Also handles the initial retrieval
export interface AdminLoginResponse {
  user: IUser;
  courseId: string;
  isAdmin: boolean;
}

// Pages and possibly a question
export interface QuestionRequestData {
  page: DBSchema.Page;
  question: TypeQuestion | null;
}

export interface QuestionReconnectData {
  pages: DBSchema.Page[];
  questions: TypeQuestion[];
}

export type QuizSessionDataObject = { quizSession: IQuizSession | null, userSession: IUserSession | null, user: IUser | null, responses: Response[] };
