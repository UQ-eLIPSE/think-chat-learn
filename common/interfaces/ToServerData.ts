import * as DBSchema from "./DBSchema";

type OID = string;

// DB schema related
export type QuestionOption = DBSchema.QuestionOption<OID>;
export type QuestionResponse = DBSchema.QuestionResponse<OID, Date>;

export type SurveyResponse = DBSchema.SurveyResponse<OID, Date>;
export type SurveyResponse_Content = DBSchema.SurveyResponseContent;

export type Mark = DBSchema.Mark<OID, Date>;
