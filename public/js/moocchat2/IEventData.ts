import {IQuiz} from "./IQuiz";

export interface IEventData_LoginSuccess {
    username: string;
    quiz: IQuiz;
}

export type IEventData_LoginFailure = string;

export interface IEventData_LoginExistingUser {
    username: string;
}

export interface IEventData_ChatGroupAnswer {
    screenName: string;
    clientIndex: number;
    answer: number;
    justification: string;
}

export interface IEventData_ChatGroupFormed {
    groupId: string;
    groupSize: number;
    groupAnswers: IEventData_ChatGroupAnswer[];
    screenName: string;
    clientIndex: number;
}

export interface IEventData_ChatGroupMessageReceived {
    screenName: string;
    clientIndex: number;
    message: string;
    timestamp: number;
}