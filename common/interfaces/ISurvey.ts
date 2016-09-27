/**
 * MOOCchat
 * Survey interface
 * 
 * Encodes the expected survey data from the server.
 */
export interface ISurvey {
    _id?: string;
    availableStart: string;
    content: ISurveyContent[];
}

export type ISurveyContentType = "HEADING" | "TEXT_SHORT" | "MULTIPLECHOICE_INLINE" | "MULTIPLECHOICE_LIST"; 

export interface ISurveyContent {
    type: ISurveyContentType;
    
    /** For TextShort + MultipleChoice* */
    questionStatement?: string;

    /** For Multiple Choice only */
    values?: string[];

    /** For Headings only */
    headingContent?: string;
}

export interface ISurveyResponseContent {
    index?: number;
    
    /**
     * Types:
     * => string = text
     * => number = multiple choice index (0-based) 
     */
    value?: string | number;
}