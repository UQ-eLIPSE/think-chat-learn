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
export type SurveyContent = DBSchema.SurveyContent;
export type SurveyContentHeading = DBSchema.SurveyContentHeading;
export type SurveyContentTextShort = DBSchema.SurveyContentTextShort;
export type SurveyContentMultipleChoiceInline = DBSchema.SurveyContentMultipleChoiceInline;
export type SurveyContentMultipleChoiceList = DBSchema.SurveyContentMultipleChoiceList;

export type User = DBSchema.User<OID>;
export type UserSession = DBSchema.UserSession<OID, Date>;

export type Mark = DBSchema.Mark<OID, Date>;
export type SystemChatPromptStatement = DBSchema.SystemChatPromptStatement;

/** Deepconcepts remake */
export type IUser = DBSchema.IUser;
export type IQuizSchedule = DBSchema.IQuizSchedule;

// API specific
export interface Quiz {
  question: Question;
  questionOptions: QuestionOption[];
  quizSchedule: QuizSchedule;
}

export interface QuizAttemptUser extends QuizAttempt {
  _user: User;
}

export interface LoginResponse {
  user: IUser;
  quiz: IQuizSchedule;
}
