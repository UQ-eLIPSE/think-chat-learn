import * as DBSchema from "./DBSchema";

type OID = string;

// DB schema related
export type QuestionResponse = DBSchema.QuestionResponse<OID, Date>;

export type SurveyResponse = DBSchema.SurveyResponse<OID, Date>;
export type SurveyResponse_Content = DBSchema.SurveyResponse_Content;

export type Mark = DBSchema.Mark<OID, Date>;