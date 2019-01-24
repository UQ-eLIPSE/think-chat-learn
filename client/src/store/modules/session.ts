import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response, TypeQuestion } from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

// Websocket interfaces
import io from "socket.io-client";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { WebsocketManager } from "../../../js/WebsocketManager";
import { WebsocketEvents } from "../../../js/WebsocketEvents";
import { SocketState, MoocChatMessage, ChatMessage, StateMessage, Dictionary } from "../../interfaces";
import { MoocChatMessageTypes, MoocChatStateMessageTypes } from "../../enums";

export interface IState {
    quizSession: IQuizSession | null;
    // Note the key of this dictionary would be the questionid as we simply respond to one question
    responses: Dictionary<Response>;
    socketState: SocketState;
    chatMessages: MoocChatMessage[];
}

const state: IState = {
    quizSession: null,
    responses: {},
    // Default socket state
    socketState: {
        chatMessages: [],
        chatGroupFormed: null,
        chatTypingNotifications: null,
        socket: null
    },
    chatMessages: []
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    ADD_RESPONSE: "Adding a response",
    // Web socket mutations
    CREATE_SOCKET: "Creating the socket",
    CLOSE_SOCKET: "Closing the socket",
    DELETE_SOCKET: "Deleting the socket",
    // Chat message mutations
    APPEND_STATE_MESSAGE: "Appending a state message"
};

function handleGroupJoin(data?: IWSToClientData.ChatGroupFormed) {
    if (!data) {
        throw Error("No data for group join");
    }

    // Note the use of global state usage
    Vue.set(state.socketState, "chatGroupFormed", data);

    // Handle a join
    const joinMessage: StateMessage = {
        state: MoocChatStateMessageTypes.ON_JOIN,
        type: MoocChatMessageTypes.STATE_MESSAGE,
        message: `Joined a group of ${data.groupSize} you are Student ${data.clientIndex}`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, joinMessage);
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

    // Also handle the total chat message
    const chatMessage: MoocChatMessage = {
        type: MoocChatMessageTypes.CHAT_MESSAGE,
        content: data
    };

    Vue.set(state.chatMessages, state.chatMessages.length, chatMessage);
}

function handleChatGroupUpdate(data?: IWSToClientData.UserResponseUpdate) {
    if (!data) {
        throw Error("No data for group update");
    }

    const dictionary = state.socketState!.chatGroupFormed!.groupAnswers!;

    const entry: IWSToClientData.ChatGroupAnswer = {
        clientIndex: data.responderIndex,
        answer: data.response
    };

    if (dictionary[data.response.questionId]) {

        Vue.set(dictionary[data.response.questionId], dictionary[data.response.questionId].length, entry);
    } else {
        // Assume that the page has not been instantiated
        Vue.set(dictionary, data.response.questionId, [entry]);
    }
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

    // Handle group update
    state.socketState.socket!.on<IWSToClientData.UserResponseUpdate>(
        WebsocketEvents.INBOUND.CHAT_GROUP_UPDATE, handleChatGroupUpdate
    );
}

const getters = {
    quizSession: (): IQuizSession | null => {
        return state.quizSession;
    },

    responses: (): Dictionary<Response> => {
        return state.responses;
    },

    socketState: (): SocketState | null => {
        return state.socketState;
    },

    chatMessages: (): MoocChatMessage[] => {
        return state.chatMessages;
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

    updateQuizSession({ commit }: {commit: Commit}, quizSession: IQuizSession) {
        return API.request(API.POST, API.QUIZSESSION + "update", quizSession).then(() => {
            commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
        });
    },

    retrieveQuizSession({ commit }: { commit: Commit }, id: string) {
        return API.request(API.GET, API.QUIZSESSION + "quizsession/" + id, {}).then((data:
            { session: IQuizSession }) => {
            commit(mutationKeys.SET_QUIZ_SESSION, data.session);
            return data;
        });
    },

    sendResponse({ commit }: {commit: Commit}, response: Response) {
        return API.request(API.PUT, API.RESPONSE + "create", response).then((id: { outgoingId: string}) => {
            response._id = id.outgoingId;
            commit(mutationKeys.ADD_RESPONSE, response);
            return id.outgoingId;
        }).catch((e: Error) => {
            throw Error("Failed to send response");
        });
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

    [mutationKeys.ADD_RESPONSE](funcState: IState, data: Response) {
        Vue.set(funcState.responses, data.questionId, data);
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
    },

    [mutationKeys.APPEND_STATE_MESSAGE](funcState: IState, data: { incomingState: MoocChatStateMessageTypes,
        message: string }) {

        const outgoingMessage: StateMessage = {
            type: MoocChatMessageTypes.STATE_MESSAGE,
            state: data.incomingState,
            message: data.message
        };

        Vue.set(funcState.chatMessages, funcState.chatMessages.length, outgoingMessage);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
