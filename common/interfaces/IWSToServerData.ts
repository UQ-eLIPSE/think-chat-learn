import { ILTIData } from "./ILTIData";

// Generic
interface SessionResponse {
    quizSessionId: string;
}

// For redundancy purposes we enforce the users to send all the ids.
// A quiz attempt can only be created if there is the a known user (userid)
// doing a particular quiz (quizid) at a given time (quizSessionId). They
// would then be attempting to do a question (responseId, questionId)
interface QuizAttemptResponse {
    quizSessionId: string;
}

export interface AnswerResponse extends QuizAttemptResponse {
    optionId: string | null;
    justification: string;
}

export interface ChatGroupStatus {
    quizId: string;
    questionId: string;
    userId: string;
}

interface ChatGroupResponse extends QuizAttemptResponse {
    groupId: string;
}

// "To server" data interfaces
export interface Logout extends SessionResponse {
    groupId: string;
}

export interface ChatGroupJoin {
    responseId: string;
    quizId: string;
    questionId: string;
    quizSessionId: string;
    userId: string;
}

export interface ChatGroupUnJoin {
    responseId: string;
    quizId: string;
    questionId: string;    
}
export interface ChatGroupSendMessage extends ChatGroupResponse {
    message: string;
    userId: string;
    questionId: string;
}

export interface ChatGroupReconnect extends ChatGroupResponse {}

// The intent is to tell the chat room to update their response id/groupanswer bank
export interface ChatGroupUpdateResponse extends ChatGroupResponse {
    responseId: string;
}
export interface ChatGroupQuitStatusChange extends ChatGroupResponse {
    quitStatus: boolean;
}
export interface ChatGroupTypingNotification extends ChatGroupResponse {
    isTyping: boolean;
}

export interface SessionSocketResync extends SessionResponse {}
export interface StoreSession extends SessionResponse {}
