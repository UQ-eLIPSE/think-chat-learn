import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../common/js/WebsocketManager";

// An interface which handles the chat states
export interface SocketState {
    // Note chat messages exclude system messages/join messages
    chatMessages: IWSToClientData.ChatGroupMessage[];
    chatGroupFormed: IWSToClientData.ChatGroupFormed | null;
    chatTypingNotifications: IWSToClientData.ChatGroupTypingNotification | null;
    socket: WebsocketManager | null;
}
