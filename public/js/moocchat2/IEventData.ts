import {IQuiz} from "./IQuiz";

export interface IEventData_LoginSuccess {
    username: string;
    quiz: IQuiz;
}

export type IEventData_LoginFailure = string;

export interface IEventData_LoginExistingUser {
    username: string;
}

export interface IEventData_ChatGroupFormed {
    groupId: string;
    groupSize: number;
    groupAnswers: any[];    // TODO:
    screenName: string;
    clientIndex: number;
}

export interface IEventData_ChatGroupMessageReceived {
    screenName: string;
    clientIndex: number;
    message: string;
    timestamp: number;
}