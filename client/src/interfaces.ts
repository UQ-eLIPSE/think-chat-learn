import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "js/WebsocketManager";

// An interface which handles the chat states
export interface SocketState {
    chatMessages: IWSToClientData.ChatGroupMessage[];
    chatGroupFormed: IWSToClientData.ChatGroupFormed | null;
    chatTypingNotifications: IWSToClientData.ChatGroupTypingNotification | null;
    socket: WebsocketManager | null;
}
