// The basic class of all elements in the DB
export interface Document<OID> {
  _id?: OID;
}

export interface IUser extends Document<string> {
  username?: string;
  firstName?: string;
  lastName?: string;
  researchConsent?: boolean | null;
}

export interface IQuizSchedule extends Document<string> {
  questionId?: string;
  course?: string;
  availableStart?: Date;
  availableEnd?: Date;
}

export interface ChatMessage<OID, Date> {
  _id?: OID;
  quizAttemptId?: OID;
  chatGroupId?: OID;
  timestamp?: Date;
  content?: string;
}

export interface ChatGroup<OID> {
  _id?: OID;
  quizAttemptIds?: OID[];
  quizScheduleId?: OID;
}

export interface Question<OID> {
  _id?: OID;
  title?: string;
  content?: string;
  course?: string;

  /**
   * Contains text that will appear to the side of the chat window; intended
   * as a reminder to students during chat session.
   */
  inChatTextBlock?: string | null;

  /**
   * Contains system-generated chat prompts (when enabled). Used to send automatic message prompts when students have
   * stopped chatting.
   */
  systemChatPromptStatements?: SystemChatPromptStatement[] | null;
}

export interface SystemChatPromptStatement {
  absoluteTimeDelay: number | undefined;
  statement: string;
}

export interface QuestionAdvice<OID> {
  _id?: OID;
  questionId?: OID;
  content?: string;
}

export interface QuestionOption<OID> {
  _id?: OID;
  questionId?: OID;
  sequence?: number;
  content?: string;
}

export interface QuestionOptionCorrect<OID> {
  _id?: OID;
  questionId?: OID;
  optionId?: OID;
  justification?: string;
}

export interface QuestionResponse<OID, Date> {
  _id?: OID;
  optionId?: OID | null;
  justification?: string;
  timestamp?: Date;
}

export interface QuizSchedule<OID, Date> {
  _id?: OID;
  questionId?: OID;
  course?: string;
  availableStart?: Date;
  availableEnd?: Date;
}

export interface QuizAttempt<OID> {
  _id?: OID;
  userSessionId?: OID;
  quizScheduleId?: OID;
  responseInitialId?: OID | null;
  responseFinalId?: OID | null;
}

export interface QuizAttemptTransition<OID, Date> {
  _id?: OID;
  quizAttemptId?: OID;
  timestamp?: Date;
  state?: string;
}

export interface Survey<OID, Date> {
  _id?: OID;
  availableStart?: Date;
  content?: SurveyContent[];
  course?: string;
}

export interface SurveyContentHeading {
  type: "HEADING";
  headingContent: string;
}

export interface SurveyContentTextShort {
  type: "TEXT_SHORT";
  questionStatement: string;
}

export interface SurveyContentMultipleChoiceInline {
  type: "MULTIPLECHOICE_INLINE";
  questionStatement: string;
  values: string[];
}

export interface SurveyContentMultipleChoiceList {
  type: "MULTIPLECHOICE_LIST";
  questionStatement: string;
  values: string[];
}

export type SurveyContent =
  | SurveyContentHeading
  | SurveyContentTextShort
  | SurveyContentMultipleChoiceInline
  | SurveyContentMultipleChoiceList;

export interface SurveyResponse<OID, Date> {
  _id?: OID;
  quizAttemptId?: OID;
  surveyId?: OID;
  timestamp?: Date;
  content?: SurveyResponseContent[];
}

export interface SurveyResponseContent {
  index: number;

  /**
   * Types:
   * => string = text
   * => number = multiple choice index (0-based)
   */
  value: string | number;
}

export interface User<OID> {
  _id?: OID;
  username?: string;
  firstName?: string;
  lastName?: string;
  researchConsent?: boolean | null;
}

export interface UserSession<OID, Date> {
  _id?: OID;
  userId?: OID;
  timestampStart?: Date;
  timestampEnd?: Date | null;
  type?: UserSessionType;
  course?: string;
}

export type UserSessionType = "ADMIN" | "STUDENT";

export interface Mark<OID, Date> {
  _id?: OID;
  markerUserSessionId?: OID;
  quizAttemptId?: OID;
  value?: string | number;
  method?: MarkingMethod;
  timestamp?: Date;
  invalidated?: Date | null;
  markerId?: OID;
}

// export type MarkingMethod = "MOUSOKU";
export type MarkingMethod = string;
