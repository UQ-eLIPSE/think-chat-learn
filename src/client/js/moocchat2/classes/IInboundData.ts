import {IQuiz} from "./IQuiz";
import {ISurvey} from "./ISurvey";

// Generic
interface SuccessState {
    success: boolean;
}

interface ChatGroupAnswer {
    clientIndex: number;
    answer: {
        _id?: string;
        justification: string;
        optionId: string;
    }
}


// Inbound data interfaces
export interface LoginSuccess {
    sessionId: string;
    username: string;
    quiz: IQuiz;
    survey: ISurvey;
    researchConsentRequired: boolean;
}
export type LoginFailure = string;
export interface LoginExistingUser {
    username: string;
}

export interface ChatGroupFormed {
    groupId: string;
    groupSize: number;
    groupAnswers: ChatGroupAnswer[];
    screenName: string;
    clientIndex: number;
}
export interface ChatGroupMessage {
    screenName: string;
    clientIndex: number;
    message: string;
    timestamp: number;
}
export interface ChatGroupQuitStatusChange {
    groupId: string;
    groupSize: number;
    quitQueueSize: number;

    screenName: string;
    clientIndex: number;
    quitStatus: boolean;
}
export interface ChatGroupTypingNotification {
    clientIndicies: number[]
}

export type BackupClientEnterQueueState = SuccessState;
export interface ClientPoolCountUpdate {
    backupClientQueue: {
        quizScheduleId: string;
    };
    numberOfClients: number;
}
export interface BackupClientQueueUpdate {
    clients: { username: string; }[];
}

export interface LogoutSuccess {
    sessionId: string;
}