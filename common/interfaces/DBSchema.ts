import { PageType, QuestionType, LTIRoles } from "../enums/DBEnums";

// Determines what the type should be. Can be changed based on DB needs
type OID = string;
// A page of 4 types, note that IPage itself cannot be used as a viable page
export type Page = IQuestionAnswerPage | IInfoPage | IDiscussionPage | ISurveyPage;
// A question associated with an IQuestioNAnswerPage. Can either be an MCQ or Qualitative one
// TODO remove the old Question interface in favour of the new one
export type TypeQuestion = IQuestionMCQ | IQuestionQualitative;

// We either answer an MCQ or a qualitative
export type Response = IResponseMCQ | IResponseQualitative;

// The basic class of all elements in the DB
export interface Document {
  _id?: OID;
}

// Contains details of user
export interface IUser extends Document {
  username?: string;
  firstName?: string;
  lastName?: string;
  researchConsent?: boolean | null;
}

// A user session is defined every time the enter the page/login successfully
export interface IUserSession extends Document {
    userId?: OID;
    // Note these two times should be the tostring of a valid date
    startTime?: string;
    endTime?: string;
    course?: string;
    // Currently an enum
    role?: LTIRoles;
}

// A quiz session is when a user decides to take on/attempt a quiz
// Note we record the whole thing such as what questions they answered
export interface IQuizSession extends Document {
  userSessionId?: OID;
  quizId?: OID;
  // A response is defined by a referral to a page
  // with the appropiate content
  responses?: OID[];
}

// Contains a question in which people can answer.
// It may be multi choice or it could be qualitative

// Note we associate the courseId with the question so that
// the admins can see their own questions. E.g. MECH courses can't see BIOL course
// data. Of course runs into the problem of different semesters of the same course
// having different ids
export interface IQuestion extends Document {
  type: QuestionType;
  content?: string;
  title?: string;
  courseId?: string;
}

// A question that can be answered based on options
export interface IQuestionMCQ extends IQuestion {
  type: QuestionType.MCQ;
  options: IQuestionOption[];
}

// A question which is answered purely by confidence values
export interface IQuestionQualitative extends IQuestion {
  type: QuestionType.QUALITATIVE;
}

// An option that could be used in MCQs
export interface IQuestionOption extends Document {
  content?: string;
  isCorrect?: boolean;
  index: number;
}

// A response could either be from an MCQ or qualitative
// Therefore we accomodate for an option or simply a string
// In both cases there is a confidence value and a link to the question
// (Whether or not we want redundancy here is yet to be known)
export interface IResponse extends Document {
  type: QuestionType;
  confidence: number;
  questionId: OID;
  quizId: OID;
  quizSessionId: OID;
}

// MCQ answers points to an option
export interface IResponseMCQ extends IResponse {
    type: QuestionType.MCQ;
    optionId: OID;
}

// Qualitative is simply a string
export interface IResponseQualitative extends IResponse {
    type: QuestionType.QUALITATIVE;
    content: string;
}

// Contains a quiz which contains questions that people can answer
export interface IQuiz extends Document {
    title?: string;
    pages?: Page[];
    course?: string;
    // Note while the functionality-wise the start and end are dates,
    // they are stored as strings due the fact that sending a date over is not feasible
    availableStart?: Date;
    availableEnd?: Date;
}

// A page to be rendered. All pages contain at the very
// least a type (to indicate how to be rendered),
// a title and some content
export interface IPage extends Document {
    type: PageType;
    title: string;
    content: string;
    timeoutInMins: number;
}

// A discussion page needs a question id so
// that the user's responses can be displayed on the client side
export interface IDiscussionPage extends IPage {
  type: PageType.DISCUSSION_PAGE;
  questionId: string;
}

// Contains a linkage to a question/prompt which could be used
// to populate the page
export interface IQuestionAnswerPage extends IPage {
  type: PageType.QUESTION_ANSWER_PAGE;
  questionId: string;
}

// Info pages are simply pages with content, existence should be enough to determine the rendering
export interface IInfoPage extends IPage {
  type: PageType.INFO_PAGE;
}

export interface ISurveyPage extends IPage {
  type: PageType.SURVEY_PAGE;
  surveyId: string;
}

export interface IQuizSchedule extends Document {
  questionId?: string;
  course?: string;
  availableStart?: Date;
  availableEnd?: Date;
}

// A message that was sent. Within a chat group. Contains
// a user id which is presumably good (as in the user is part of the group)
// Since each chat group can point to multiple questions, we have to store the questionId as well
export interface IChatMessage extends Document {
  userId: OID;
  content: string;
  timeStamp: Date;
  questionId: OID;
}

// A chat group contains multiple people talking.
// A group is formed within a quiz id hence we generally search by it
// Assumes that the quiz sessions ids inside are good/valid
// Also a quiz group can only be in one session.
export interface IChatGroup extends Document {
  messages?: IChatMessage[];
  quizSessionIds?: OID[];
  quizId?: OID;
  questionIds?: OID[];
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
  content?: Survey_Content[];
  course?: string;
}

export interface Survey_Content_Heading {
  type: "HEADING";
  headingContent: string;
}

export interface Survey_Content_TextShort {
  type: "TEXT_SHORT";
  questionStatement: string;
}

export interface Survey_Content_MultipleChoiceInline {
  type: "MULTIPLECHOICE_INLINE";
  questionStatement: string;
  values: string[];
}

export interface Survey_Content_MultipleChoiceList {
  type: "MULTIPLECHOICE_LIST";
  questionStatement: string;
  values: string[];
}

export type Survey_Content =
  | Survey_Content_Heading
  | Survey_Content_TextShort
  | Survey_Content_MultipleChoiceInline
  | Survey_Content_MultipleChoiceList;

export interface SurveyResponse<OID, Date> {
  _id?: OID;
  quizAttemptId?: OID;
  surveyId?: OID;
  timestamp?: Date;
  content?: SurveyResponse_Content[];
}

export interface SurveyResponse_Content {
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
