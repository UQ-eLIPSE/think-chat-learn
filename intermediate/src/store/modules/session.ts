import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response, IQuiz,
    IDiscussionPage,
    TypeQuestion,
    QuestionReconnectData} from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";
import store from "..";
// Websocket interfaces
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../../common/js/WebsocketEvents";
import { SocketState } from "../../interfaces";

export interface IState {
    quizSession: IQuizSession | null;
    socketState: SocketState;
    poolSize: number;
    refreshTime: number;
    timeoutTime: number;
    tokens: string[]
}

const state: IState = {
    quizSession: null,
    // Default socket state
    socketState: {
        chatMessages: [],
        chatGroupFormed: null,
        chatTypingNotifications: null,
        socket: null
    },
    poolSize: -1,
    timeoutTime: -1, 
    refreshTime: Date.now(),
    tokens: []
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    APPEND_TOKEN: "Appending a token",
    // Web socket mutations
    CREATE_SOCKET: "Creating the socket",
    CLOSE_SOCKET: "Closing the socket",
    DELETE_SOCKET: "Deleting the socket"
};

function handleTermination() {
    alert("The connection to the server has been severed.\n" +
    "This is most likely due to another tab/browser overriding a session");

    // Cleaning up is basically stopping the timer and closing the socket
    state.socketState.socket!.close();
    Vue.set(state.socketState, "socket", null);
    Vue.set(state, "stopBrowser", true);
}

function handlePing(data?: IWSToClientData.ChatPing) {
    if (data) {
        Vue.set(state, "poolSize", data.size);
        Vue.set(state, "refreshTime", Date.now());
        Vue.set(state, "timeoutTime", data.timeout);
    }
}

// Grabs the reference from user.ts
function getToken(): string | null {
    return store.getters.token;
}

// Handles the socket events.
function registerSocketEvents() {
    // Wait for an acknowledge?
    state.socketState.socket!.once(WebsocketEvents.INBOUND.STORE_SESSION_ACK, () => {
        return;
    });

    // Handles the terminate of the socket
    state.socketState.socket!.on(WebsocketEvents.INBOUND.TERMIANTE_BROWSER, handleTermination);

    state.socketState.socket!.on(WebsocketEvents.INBOUND.CHAT_PING, handlePing);

}

const getters = {
    socketState: (): SocketState | null => {
        return state.socketState;
    },

    poolSize: (): number => {
        return state.poolSize;
    },

    quizSession: (): IQuizSession | null => {
        return state.quizSession;
    },

    refreshTime: (): number => {
        return state.refreshTime;
    },

    tokens: (): string[] => {
        return state.tokens;
    },

    timeoutTime: (): number => {
        return state.timeoutTime;
    }
};
const actions = {

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
    },

    createQuizSession({ commit }: {commit: Commit}, quizSession: IQuizSession) {

        return API.request(API.PUT, API.QUIZSESSION + "create", quizSession, undefined,
            getToken()).then((id: { outgoingId: string }) => {

            quizSession._id = id.outgoingId;
            commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
            return id.outgoingId;
        });
    },

    sendResponse({ commit }: {commit: Commit}, response: Response) {
        return API.request(API.PUT, API.RESPONSE + "create", response, undefined,
            getToken()).catch((e: Error) => {
            throw Error("Failed to send response");
        });
    },

    createIntermediate({ commit }: {commit: Commit}, responses: Response[]) {
        return API.request(API.POST, API.USER + "intermediate-register", responses,
            undefined, getToken()).then((token: string) => {
                commit(mutationKeys.APPEND_TOKEN, token);
            });
    }
};

const mutations = {

    [mutationKeys.SET_QUIZ_SESSION](funcState: IState, data: IQuizSession) {
        Vue.set(funcState, "quizSession", data);
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

    [mutationKeys.APPEND_TOKEN](funcState: IState, token: string) {
        if (funcState.tokens) {
            Vue.set(funcState.tokens, funcState.tokens.length, token);
        }
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
