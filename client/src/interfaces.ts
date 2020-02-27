import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../common/js/WebsocketManager";
import { TCLMessageTypes, TCLStateMessageTypes } from "./enums";

export type TCLMessage = ChatMessage | SystemMessage | StateMessage;

// An interface which handles the chat states
export interface SocketState {
    // Note chat messages exclude system messages/join messages
    chatMessages: IWSToClientData.ChatGroupMessage[];
    chatGroupFormed: IWSToClientData.ChatGroupFormed | null;
    chatTypingNotifications: IWSToClientData.ChatGroupTypingNotification | null;
    socket: WebsocketManager | null;
}

export interface Message {
    type: TCLMessageTypes;
}

export interface ChatMessage extends Message {
    type: TCLMessageTypes.CHAT_MESSAGE;
    content: IWSToClientData.ChatGroupMessage;
}

export interface SystemMessage extends Message {
    type: TCLMessageTypes.SYSTEM_MESSAGE;
    message: string;
}

export interface StateMessage extends Message {
    type: TCLMessageTypes.STATE_MESSAGE;
    state: TCLStateMessageTypes;
    message: string;
}

export interface TimerSettings {
    referencedPageId: string;
    timeoutInMins: number;
}

export interface Dictionary<T> {
    [key: string]: T;
}
