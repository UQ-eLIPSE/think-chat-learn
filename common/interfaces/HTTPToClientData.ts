import { ChatGroupFormed, ChatGroupMessage } from "./IWSToClientData";
import { Response } from "./ToClientData";

export interface ChatGroupResync {
    chatGroupFormed: ChatGroupFormed;
    messages: ChatGroupMessage[];
    startTime: number;
}
