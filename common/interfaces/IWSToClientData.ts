import * as ToClientData from "../../common/interfaces/ToClientData";


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
    quizAttemptId: string;
    username: string;
    quiz: ToClientData.Quiz;
    survey: ToClientData.Survey | null;
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
    clientIndex: number;
}
export interface ChatGroupMessage {
    clientIndex: number;
    message: string;
    timestamp: number;
}
export interface ChatGroupQuitStatusChange {
    groupId: string;
    groupSize: number;

    clientIndex: number;
    quitStatus: boolean;
}
export interface ChatGroupTypingNotification {
    clientIndicies: number[]
}

export interface BackupClientEnterQueueState extends SuccessState {
    quizAttemptId: string;
}
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