import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response } from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

// Websocket interfaces
import io from "socket.io-client";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { WebsocketManager } from "../../../js/WebsocketManager";
import { WebsocketEvents } from "../../../js/WebsocketEvents";
import { SocketState } from "../../interfaces";

export interface IState {
    quizSession: IQuizSession | null;
    response: Response | null;
    currentIndex: number;
    socketState: SocketState;
}

const state: IState = {
    quizSession: null,
    response: null,
    currentIndex: 0,
    // Default socket state
    socketState: {
        chatMessages: [],
        chatGroupFormed: null,
        chatTypingNotifications: null,
        socket: null
    }
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    SET_RESPONSE: "Setting a response",
    INCREMENTING_INDEX: "Incrementing the index",
    DECREMENTING_INDEX: "Decrementing the index",
    // Web socket mutations
    CREATE_SOCKET: "Creating the socket",
    CLOSE_SOCKET: "Closing the socket",
    DELETE_SOCKET: "Deleting the socket"
};

function handleGroupJoin(data?: IWSToClientData.ChatGroupFormed) {
    if (!data) {
        throw Error("No data for group join");
    }

    // Note the use of global state usage
    Vue.set(state.socketState, "chatGroupFormed", data);
}

function handleTypingNotification(data?: IWSToClientData.ChatGroupTypingNotification) {
    if (!data) {
        throw Error("No data for typing notifications");
    }

    Vue.set(state.socketState, "chatTypingNotifications", data);
}

function handleIncomingChatMessage(data?: IWSToClientData.ChatGroupMessage) {
    if (!data) {
        throw Error("No data for typing notifications");
    }

    Vue.set(state.socketState.chatMessages, state.socketState.chatMessages.length, data);
}

// Handles the socket events.
function registerSocketEvents() {
    // Wait for an acknowledge?
    state.socketState.socket!.once(WebsocketEvents.INBOUND.STORE_SESSION_ACK, () => {
        return;
    });

    // Handle group formation
    state.socketState.socket!.once<IWSToClientData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED,
        handleGroupJoin);

    // Handle chat logs
    state.socketState.socket!.on<IWSToClientData.ChatGroupMessage>(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE,
        handleIncomingChatMessage);

    // Handle typing states
    state.socketState.socket!.on<IWSToClientData.ChatGroupTypingNotification>(
        WebsocketEvents.INBOUND.CHAT_GROUP_TYPING_NOTIFICATION, handleTypingNotification);
}

const getters = {
    quizSession: (): IQuizSession | null => {
        return state.quizSession;
    },

    response: (): Response | null => {
        return state.response;
    },

    currentIndex: (): number => {
        return state.currentIndex;
    },

    socketState: (): SocketState | null => {
        return state.socketState;
    }
};
const actions = {
    createQuizSession({ commit }: {commit: Commit}, quizSession: IQuizSession) {
        return API.request(API.PUT, API.QUIZSESSION + "create", quizSession).then((id: { outgoingId: string }) => {
            quizSession._id = id.outgoingId;
            commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
            return id.outgoingId;
        });
    },

    sendResponse({ commit }: {commit: Commit}, response: Response) {
        return API.request(API.PUT, API.RESPONSE + "create", response).then((id: { outgoingId: string}) => {
            response._id = id.outgoingId;
            commit(mutationKeys.SET_RESPONSE, response);
            return id;
        }).catch((e: Error) => {
            throw Error("Failed to send response");
        });
    },

    incrementIndex({ commit }: {commit: Commit}) {
        return commit(mutationKeys.INCREMENTING_INDEX);
    },

    // The issue with creating the socket is that generally speaking you want to have
    // your components to react to a certain socket event. E.g. when a user writes
    // a message, append to the chatbox. Hence we create an interface known as 
    // socket_state which neatly tells the components what socket should be at
    createSocket({ commit }: {commit: Commit}) {
        return commit(mutationKeys.CREATE_SOCKET);
    },

    deleteSocket({ commit }: {commit: Commit}) {
        return commit(mutationKeys.DELETE_SOCKET);
    },

    closeSocket({ commit }: {commit: Commit}) {
        return commit(mutationKeys.CLOSE_SOCKET);
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ_SESSION](funcState: IState, data: IQuizSession) {
        Vue.set(funcState, "quizSession", data);
    },

    [mutationKeys.SET_RESPONSE](funcState: IState, data: Response) {
        Vue.set(funcState, "response", data);
    },

    [mutationKeys.INCREMENTING_INDEX](funcState: IState) {
        Vue.set(funcState, "currentIndex", funcState.currentIndex + 1);
    },

    [mutationKeys.CREATE_SOCKET](funcState: IState) {
        if (!funcState.socketState.socket) {
            Vue.set(funcState.socketState, "socket", new WebsocketManager());
            registerSocketEvents();
        }
    },

    [mutationKeys.CLOSE_SOCKET](funcState: IState) {
        if (funcState.socketState.socket) {
            funcState.socketState.socket.close();
        }
    },

    [mutationKeys.DELETE_SOCKET](funcState: IState) {
        if (funcState.socketState.socket) {
            Vue.delete(funcState, "socket");
        }
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
