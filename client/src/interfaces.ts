import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "js/WebsocketManager";
import { MoocChatMessageTypes, MoocChatStateMessageTypes } from "./enums";

export type MoocChatMessage = ChatMessage | SystemMessage | StateMessage;

// An interface which handles the chat states
export interface SocketState {
    // Note chat messages exclude system messages/join messages
    chatMessages: IWSToClientData.ChatGroupMessage[];
    chatGroupFormed: IWSToClientData.ChatGroupFormed | null;
    chatTypingNotifications: IWSToClientData.ChatGroupTypingNotification | null;
    socket: WebsocketManager | null;
}

export interface Message {
    type: MoocChatMessageTypes;
}

export interface ChatMessage extends Message {
    type: MoocChatMessageTypes.CHAT_MESSAGE;
    content: IWSToClientData.ChatGroupMessage;
}

export interface SystemMessage extends Message {
    type: MoocChatMessageTypes.SYSTEM_MESSAGE;
    message: string;
}

export interface StateMessage extends Message {
    type: MoocChatMessageTypes.STATE_MESSAGE;
    state: MoocChatStateMessageTypes;
}

