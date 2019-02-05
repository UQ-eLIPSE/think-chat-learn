import * as ToClientData from "../../common/interfaces/ToClientData";


// Generic
interface SuccessState {
    success: boolean;
}

// Index is needed to show that user X has done Y
export interface ChatGroupAnswer {
    clientIndex: number;
    answer: ToClientData.Response;
}

export interface GroupAnswerDictionary { [questionId: string]: ChatGroupAnswer[]; }

export interface ChatGroupFormed {
    groupId: string;
    groupSize: number;
    // Note that the key is the question for the answer array
    // i.e. a group can have multiple answers for muliple questions.
    groupAnswers: GroupAnswerDictionary;
    clientIndex: number;
}
export interface ChatGroupMessage {
    clientIndex: number;
    message: string;
    timestamp: number;
}

export interface ChatGroupSystemMessage {
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
    clientIndicies: number[];
}

export interface ChatGroupDisconnect {
    clientIndex: number;
}

export interface ChatGroupReconnect {
    clientIndex: number;
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
    quizSessionId: string;
}

export interface UserResponseUpdate {
    response: ToClientData.Response;
    responderIndex: number;
}
