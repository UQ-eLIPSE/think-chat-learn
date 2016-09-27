import {ILTIData} from "./ILTIData";
import {ISurveyResponseContent} from "./ISurvey";

// Generic
interface SessionResponse {
    sessionId: string;
}

export interface AnswerResponse extends SessionResponse {
    optionId: string;
    justification: string;
}

interface ChatGroupResponse extends SessionResponse {
    groupId: string;
}

// "To server" data interfaces
export interface LoginLti extends ILTIData { }
export interface LoginResearchConsent extends SessionResponse {
    researchConsent: boolean;
}

export interface InitialAnswer extends AnswerResponse { }
export interface RevisedAnswer extends AnswerResponse { }

export interface ChatGroupJoin extends SessionResponse { }
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
export interface BackupClientReturnToQueue extends SessionResponse { }
export interface BackupClientStatusRequest extends SessionResponse { }
export interface BackupClientTransferConfirm extends SessionResponse { }

export interface SurveyResponse extends SessionResponse {
    content: ISurveyResponseContent[]
}

export interface Logout extends SessionResponse {}

export interface TerminateSessions {
    username: string;
}

export interface SessionSocketResync extends SessionResponse {}
