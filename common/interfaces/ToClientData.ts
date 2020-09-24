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
export type IChatMessage = DBSchema.IChatMessage;
export type ICriteria = DBSchema.ICriteria;
export type IRubric = DBSchema.IRubric;
export type Response = DBSchema.Response;
// API specific

export enum LoginResponseTypes {
  GENERIC_LOGIN = 1,
  ADMIN_LOGIN = 2,
  BACKUP_LOGIN = 3,
  INTERMEDIATE_LOGIN = 4
}

interface GenericLogin {
  type: LoginResponseTypes;
}

// Essentially the user should only have one page
export interface LoginResponse extends GenericLogin {
  type: LoginResponseTypes.GENERIC_LOGIN;
  user: IUser;
  // Stores course code e.g. ENGG1200_X_Y
  courseId: string;
  courseTitle?: string;
  quizId?: string | null;
  customQuizId?: string | null;
  available: boolean;
  isAdmin?: boolean;
}

// Is also an admin
export interface BackupLoginResponse extends GenericLogin {
  type: LoginResponseTypes.BACKUP_LOGIN;
  user: IUser;
  courseId: string;
  courseTitle?: string;
  quizId?: string | null;
  customQuizId?: string | null;
  isAdmin: boolean;
}

// Only difference is the type and the quizSessionId
export interface IntermediateLogin extends GenericLogin {
  type: LoginResponseTypes.INTERMEDIATE_LOGIN;
  user: IUser;
  courseId: string;
  courseTitle?: string;
  quizId?: string | null;
  customQuizId?: string | null;
  quizSessionId: string | null;
  available: boolean;
  responseId: string;
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
export interface AdminLoginResponse extends GenericLogin {
  type: LoginResponseTypes.ADMIN_LOGIN;
  user: IUser;
  courseId: string;
  courseTitle?: string;
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

export type QuizSessionDataObject = { quizSession: IQuizSession | null,
  userSession: IUserSession | null, user: IUser | null,
  responses: Response[]
};

export interface ResponseMessage<T = void> {
  success: boolean;
  payload?: T;
  message?: string;
}