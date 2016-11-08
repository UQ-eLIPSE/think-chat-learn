
export interface ChatMessage<OID, Date> {
    _id?: OID,
    sessionId?: OID,
    timestamp?: Date,
    content?: string
}



export interface Question<OID> {
    _id?: OID,
    title?: string,
    content?: string,
    course?: string,
}

export interface QuestionOption<OID> {
    _id?: OID,
    questionId?: OID,
    sequence?: number,
    content?: string
}

export interface QuestionOptionCorrect<OID> {
    _id?: OID,
    questionId?: OID,
    optionId?: OID,
    justification?: string
}

export interface QuestionResponse<OID, Date> {
    _id?: OID,
    optionId?: OID,
    justification?: string,
    timestamp?: Date
}



export interface QuizSchedule<OID, Date> {
    _id?: OID,
    questionId?: OID,
    course?: string,
    availableStart?: Date,
    availableEnd?: Date,
    blackboardColumnId?: number,
}



export interface Survey<OID, Date> {
    _id?: OID,
    availableStart?: Date,
    content?: Survey_Content[],
    course?: string,
}

export interface Survey_Content_Heading {
    type: "HEADING",
    headingContent: string,
}

export interface Survey_Content_TextShort {
    type: "TEXT_SHORT",
    questionStatement: string,
}

export interface Survey_Content_MultipleChoiceInline {
    type: "MULTIPLECHOICE_INLINE",
    questionStatement: string,
    values: string[],
}

export interface Survey_Content_MultipleChoiceList {
    type: "MULTIPLECHOICE_LIST",
    questionStatement: string,
    values: string[],
}

export type Survey_Content = 
    Survey_Content_Heading |
    Survey_Content_TextShort |
    Survey_Content_MultipleChoiceInline |
    Survey_Content_MultipleChoiceList;

export interface SurveyResponse<OID, Date> {
    sessionId?: OID,
    surveyId?: OID,
    timestamp?: Date,
    content?: SurveyResponse_Content[]
}

export interface SurveyResponse_Content {
    index: number,

    /**
     * Types:
     * => string = text
     * => number = multiple choice index (0-based) 
     */
    value: string | number,
}



export interface User<OID> {
    _id?: OID,
    username?: string,
    firstName?: string,
    lastName?: string,
    researchConsent?: boolean,
}



export interface UserSession<OID, Date> {
    _id?: OID,
    userId?: OID,
    quizScheduleId?: OID,
    timestampStart?: Date,
    timestampEnd?: Date,
    responseInitialId?: OID,
    responseFinalId?: OID,
    chatGroupId?: string
}
