import { ChatGroupFormed, ChatGroupMessage } from "./IWSToClientData";

export interface ChatGroupResync {
    chatGroupFormed: ChatGroupFormed,
    messages: ChatGroupMessage[]
    startTime: number;
}