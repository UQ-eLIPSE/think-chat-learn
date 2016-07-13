/**
 * MOOCchat
 * EventData interfaces
 * 
 * Encodes the expected event data from the server.
 */

import {IQuiz} from "./IQuiz";
import {ISurvey} from "./ISurvey";



export interface IEventData_GenericSuccessState {
    success: boolean;
}



/** loginSuccess */
export interface IEventData_LoginSuccess {
    sessionId: string;
    username: string;
    // hasElevatedPermissions: boolean;
    quiz: IQuiz;
    survey: ISurvey;
}

/** loginFailure */
export type IEventData_LoginFailure = string;

/** loginExistingUser */
export interface IEventData_LoginExistingUser {
    username: string;
}

/** A person's answer to the quiz in the initial answer stage */
export interface IEventData_ChatGroupAnswer {
    clientIndex: number;
    answer: {
        _id?: string;
        justification: string;
        optionId: string;
    }
}

/** chatGroupFormed */
export interface IEventData_ChatGroupFormed {
    groupId: string;
    groupSize: number;
    groupAnswers: IEventData_ChatGroupAnswer[];
    screenName: string;
    clientIndex: number;
}

/** chatGroupMessage */
export interface IEventData_ChatGroupMessageReceived {
    screenName: string;
    clientIndex: number;
    message: string;
    timestamp: number;
}

/** chatGroupQuitChange */
export interface IEventData_ChatGroupQuitChange {
    groupId: string;
    groupSize: number;
    quitQueueSize: number;

    screenName: string;
    clientIndex: number;
    quitStatus: boolean;
}

/* backupClientEnterQueueState */
export type IEventData_BackupClientEnterQueueState = IEventData_GenericSuccessState;

export interface IEventData_ClientPoolCountUpdate {
    numberOfClients: number;
}

export interface IEventData_BackupClientQueueUpdate {
    clients: {
        username: string;
    }[];
}

// export interface IEventData_SessionAvailableStatus {
//     available: boolean;
// }