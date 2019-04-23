import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response, IQuiz,
    IDiscussionPage,
    TypeQuestion,
    QuestionReconnectData} from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

// Websocket interfaces
import { WebsocketManager } from "../../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../../common/js/WebsocketEvents";
import { SocketState } from "../../interfaces";

export interface IState {
    socketState: SocketState;
}

const state: IState = {
    // Default socket state
    socketState: {
        chatMessages: [],
        chatGroupFormed: null,
        chatTypingNotifications: null,
        socket: null
    }
};

const mutationKeys = {
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

// Handles the socket events.
function registerSocketEvents() {
    // Wait for an acknowledge?
    state.socketState.socket!.once(WebsocketEvents.INBOUND.STORE_SESSION_ACK, () => {
        return;
    });

    // Handles the terminate of the socket
    state.socketState.socket!.on(WebsocketEvents.INBOUND.TERMIANTE_BROWSER, handleTermination);
}

const getters = {
    socketState: (): SocketState | null => {
        return state.socketState;
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
    }
};

const mutations = {

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
