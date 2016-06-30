/**
 * MOOCchat
 * EventData interfaces
 * 
 * Encodes the expected event data from the server.
 */

import {IQuiz} from "./IQuiz";



export interface IEventData_GenericSuccessState {
    success: boolean;
}



/** loginSuccess */
export interface IEventData_LoginSuccess {
    sessionId: string;
    username: string;
    quiz: IQuiz;
}

/** loginFailure */
export type IEventData_LoginFailure = string;

/** loginExistingUser */
export interface IEventData_LoginExistingUser {
    username: string;
}

/** A person's answer to the quiz in the initial answer stage */
export interface IEventData_ChatGroupAnswer {
    screenName: string;
    clientIndex: number;
    answer: number;
    justification: string;
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

/* backupClientEnterQueueState */
export type IEventData_BackupClientEnterQueueState = IEventData_GenericSuccessState;
