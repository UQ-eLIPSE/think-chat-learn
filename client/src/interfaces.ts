import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../common/js/WebsocketManager";
import { MessageTypes, StateMessageTypes } from "./enums";

export type Message = ChatMessage | SystemMessage | StateMessage;

// An interface which handles the chat states
export interface SocketState {
    // Note chat messages exclude system messages/join messages
    chatMessages: IWSToClientData.ChatGroupMessage[];
    chatGroupFormed: IWSToClientData.ChatGroupFormed | null;
    chatTypingNotifications: IWSToClientData.ChatGroupTypingNotification | null;
    socket: WebsocketManager | null;
}

export interface IMessage {
    type: MessageTypes;
}

export interface ChatMessage extends IMessage {
    type: MessageTypes.CHAT_MESSAGE;
    content: IWSToClientData.ChatGroupMessage;
}

export interface SystemMessage extends IMessage {
    type: MessageTypes.SYSTEM_MESSAGE;
    message: string;
}

export interface StateMessage extends IMessage {
    type: MessageTypes.STATE_MESSAGE;
    state: StateMessageTypes;
    message: string;
}

export interface TimerSettings {
    referencedPageId: string;
    timeoutInMins: number;
}

export interface Dictionary<T> {
    [key: string]: T;
}
