import * as DBSchema from "./DBSchema";

type OID = string;
type Date = string;

// DB schema related
export type ChatMessage = DBSchema.ChatMessage<OID, Date>;
export type Question = DBSchema.Question<OID>;
export type QuestionOption = DBSchema.QuestionOption<OID>;
export type QuestionOptionCorrect = DBSchema.QuestionOptionCorrect<OID>;
export type QuizSchedule = DBSchema.QuizSchedule<OID, Date>;

export type Survey = DBSchema.Survey<OID, Date>;
export type Survey_Content = DBSchema.Survey_Content;
export type Survey_Content_Heading = DBSchema.Survey_Content_Heading;
export type Survey_Content_TextShort = DBSchema.Survey_Content_TextShort;
export type Survey_Content_MultipleChoiceInline = DBSchema.Survey_Content_MultipleChoiceInline;
export type Survey_Content_MultipleChoiceList = DBSchema.Survey_Content_MultipleChoiceList;

export type User = DBSchema.User<OID>;
export type UserSession = DBSchema.UserSession<OID, Date>;

// API specific
export interface Quiz {
    question: Question;
    questionOptions: QuestionOption[];
    quizSchedule: QuizSchedule;
}