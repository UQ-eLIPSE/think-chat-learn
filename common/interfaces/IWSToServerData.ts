import {ILTIData} from "./ILTIData";
import * as ToServerData from "../../common/interfaces/ToServerData";

// Generic
interface SessionResponse {
    sessionId: string;
}

interface QuizAttemptResponse {
    quizAttemptId: string;
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
    content: ToServerData.SurveyResponse_Content[]
}

export interface TerminateSessions {
    username: string;
}

export interface SessionSocketResync extends SessionResponse {}
