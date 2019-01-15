import {ILTIData} from "./ILTIData";
import * as ToServerData from "../../common/interfaces/ToServerData";

// Generic
interface SessionResponse {
    quizSessionId: string;
}

// For redundancy purposes we enforce the users to send all the ids.
// A quiz attempt can only be created if there is the a known user (userid)
// doing a particular quiz (quizid) at a given time (quizSessionId). They
// would then be attempting to do a question (responseId, questionId)
interface QuizAttemptResponse {
    responseId: string;
    quizId: string;
    questionId: string;
    quizSessionId: string;
    userId: string;
}

export interface AnswerResponse extends QuizAttemptResponse {
    optionId: string | null;
    justification: string;
}

interface ChatGroupResponse extends QuizAttemptResponse {
    groupId: string;
}

// "To server" data interfaces
export interface LoginLti extends ILTIData { }
export interface LoginResearchConsent extends SessionResponse {
    researchConsent: boolean;
}
export interface Logout extends SessionResponse {}

export interface InitialAnswer extends AnswerResponse { }
export interface RevisedAnswer extends AnswerResponse { }

export interface ChatGroupJoin extends QuizAttemptResponse { }
export interface ChatGroupSendMessage extends ChatGroupResponse {
    message: string;
}
export interface ChatGroupQuitStatusChange extends ChatGroupResponse {
    quitStatus: boolean;
}
export interface ChatGroupTypingNotification extends ChatGroupResponse {
    isTyping: boolean;
}

export interface BackupClientAnswer extends AnswerResponse { }
export interface BackupClientReturnToQueue extends QuizAttemptResponse { }
export interface BackupClientStatusRequest extends QuizAttemptResponse { }
export interface BackupClientTransferConfirm extends QuizAttemptResponse { }

export interface SurveyResponse extends QuizAttemptResponse {
    content: ToServerData.SurveyResponse_Content[];
}

export interface TerminateSessions {
    username: string;
}

export interface SessionSocketResync extends SessionResponse {}
export interface StoreSession extends SessionResponse {}
