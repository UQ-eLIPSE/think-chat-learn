import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response, IQuiz,
    IDiscussionPage } from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

// Websocket interfaces
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../../js/WebsocketManager";
import { WebsocketEvents } from "../../../js/WebsocketEvents";
import { SocketState, MoocChatMessage, StateMessage, Dictionary } from "../../interfaces";
import { MoocChatMessageTypes, MoocChatStateMessageTypes } from "../../enums";
import { logout } from "../../../../common/js/front_end_auth";
import store from "..";
import { Utils } from "../../../../common/js/Utils";
import { PageType } from "../../../../common/enums/DBEnums";
import { ChatGroupResync } from "../../../../common/interfaces/HTTPToClientData";

export interface IState {
    quizSession: IQuizSession | null;
    // Note the key of this dictionary would be the questionid as we simply respond to one question
    responses: Dictionary<Response>;
    socketState: SocketState;
    chatMessages: MoocChatMessage[];
    resyncAmount: number;
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
    chatMessages: [],
    resyncAmount: 0
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    ADD_RESPONSE: "Adding a response",
    // Web socket mutations
    CREATE_SOCKET: "Creating the socket",
    CLOSE_SOCKET: "Closing the socket",
    DELETE_SOCKET: "Deleting the socket",
    // Chat message mutations
    APPEND_STATE_MESSAGE: "Appending a state message",
    SET_GROUP: "Setting the chat group",
    SET_SOCKET_MESSAGES: "Setting the socket messages"
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

function handleLogout(data?: IWSToClientData.LogoutSuccess) {
    if (!data) {
        throw Error("No data for logging out");
    }

    logout();
}

function handleChatDisconnect(data?: IWSToClientData.ChatGroupDisconnect) {
    if (!data) {
        throw Error("No data for chat groups");
    }

    const stateMessage: StateMessage = {
        state: MoocChatStateMessageTypes.CHAT_GROUP_LEAVE,
        type: MoocChatMessageTypes.STATE_MESSAGE,
        message: `Student ${data.clientIndex} has disconnected`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, stateMessage);
}

function handleChatGroupReconnect(data?: IWSToClientData.ChatGroupReconnect) {
    if (!data) {
        throw Error("No data for chat groups");
    }

    const stateMessage: StateMessage = {
        state: MoocChatStateMessageTypes.CHAT_GROUP_RECONNECT,
        type: MoocChatMessageTypes.STATE_MESSAGE,
        message: `Student ${data.clientIndex} has reconnected`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, stateMessage);
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

    // Handle logout success
    state.socketState.socket!.once<IWSToClientData.LogoutSuccess>(
        WebsocketEvents.INBOUND.LOGOUT_SUCCESS, handleLogout
    );

    // Handles disconnects from other people
    state.socketState.socket!.on<IWSToClientData.ChatGroupDisconnect>(WebsocketEvents.INBOUND.CHAT_GROUP_DISCONNECT,
        handleChatDisconnect);
    state.socketState.socket!.on<IWSToClientData.ChatGroupReconnect>(WebsocketEvents.INBOUND.CHAT_GROUP_RECONNECT,
        handleChatGroupReconnect);
}

async function handleReconnect(data: any) {
    // Even if we succesfully reconnect, we need to make sure we are still there
    let quizSession: IQuizSession | null = null;
    if (!state.quizSession) {
        // If we do not have a quiz session then that means we just have a user session.
        // Find the quiz session
        const quiz: IQuiz = store.getters.quiz;
        const userSession: IUserSession = store.getters.userSession;

        if (userSession && quiz) {
            // Retreive the quiz and user id
            quizSession = (await API.request(API.POST, API.QUIZSESSION + "fetchByUserQuiz", {
                userId: userSession.userId,
                quizId: quiz._id
            })).data;

            // If we have a quiz session assign it else, do nothing
            if (!quizSession) {
                return;
            }

            store.dispatch("updateQuizSession", quizSession);
        } else {
            return;
        }
    }

    // We have a quiz session (whether it is an on client disconnect or not)
    // The next step is to check for our socket session
    const socketPresent: { outcome: boolean } = await API.request(API.POST, API.QUIZSESSION + "findSession", {
        quizSessionId: state.quizSession!._id!
    });

    if (socketPresent.outcome) {
        // Notify the server of a resync
        state.socketState!.socket!.emit(WebsocketEvents.OUTBOUND.SESSION_SOCKET_RESYNC, {
            quizSessionId: state.quizSession!._id
        });

        // Fetch the group based on quiz id. If we don't have one.
        if (!state.socketState!.chatGroupFormed) {
            const groupSession: ChatGroupResync =
                await API.request(API.POST, API.CHATGROUP +
                    "recoverSession", { quizSessionId: state.quizSession!._id });

            await store.dispatch("updateGroup", groupSession.chatGroupFormed);
            await store.dispatch("updateSocketMessages", groupSession.messages);
            await store.dispatch("updatePageBasedOnTime", groupSession.startTime);
        }

        // We then check if the quiz session has a group id
        if (state.socketState!.chatGroupFormed) {
            setTimeout(() => state.socketState!.socket!.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_RECONNECT, {
                quizSessionId: state.quizSession!._id,
                groupId: state.socketState!.chatGroupFormed!.groupId }
            ), 1000);
        } else {
            // If we reach this point, then we need to resync to the appropiate page instead
        }
    } else {
        // No present socket session present. Don't bother with reconnection. This could possibly mean that the
        // server has gone down or the socket session has been garbage collected
        return;
    }
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
    },

    resyncAmount: (): number => {
        return state.resyncAmount;
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
        commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
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
    },

    updateGroup({ commit }: {commit: Commit}, data: IWSToClientData.ChatGroupFormed) {
        return commit(mutationKeys.SET_GROUP, data);
    },

    updateSocketMessages({ commit }: {commit: Commit}, data: ChatGroupResync) {
        return commit(mutationKeys.SET_SOCKET_MESSAGES, data);
    },

    updatePageBasedOnTime({ commit }: {commit: Commit}, startTime: number) {
        // Given a quiz, compute the amount of time for each page.
        const currentTime = Date.now();
        let trackedTime = startTime;
        const quiz: IQuiz | null = store.getters.quiz;
        if (!quiz || !quiz.pages) {
            return;
        }

        // Since the group formation occurs at the first discussion, we iterate from there
        const firstDiscussionIndex = quiz.pages.findIndex((element) => {
            return element.type === PageType.DISCUSSION_PAGE;
        });

        for (let i = firstDiscussionIndex ; i < quiz.pages.length; i++) {
            const lowerBound = trackedTime;
            const upperBound = trackedTime + Utils.DateTime.minToMs(quiz.pages[i].timeoutInMins);
            if (currentTime >= lowerBound && upperBound >= currentTime) {
                // Set the indices
                store.commit("Sets the current index", i);
                store.commit("Setting the max index", i);

                // Figure out the most recent discussion page
                for (let j = i; j >= 0; j--) {
                    if (quiz.pages[j].type === PageType.DISCUSSION_PAGE) {
                        store.commit("Setting current discussion", (quiz.pages[j] as IDiscussionPage).questionId);
                        break;
                    }
                }

                // Set the amount of time remaining for the timer
                const timeRemaining = upperBound - currentTime;
                Vue.set(state, "resyncAmount", Utils.DateTime.msToMinutes(timeRemaining));
            }

            trackedTime = upperBound;
        }
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
            Vue.set(funcState.socketState, "socket", new WebsocketManager(handleReconnect));
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
    },

    [mutationKeys.SET_GROUP](funcState: IState, data: IWSToClientData.ChatGroupFormed) {
        Vue.set(funcState.socketState!, "chatGroupFormed", data);
    },

    [mutationKeys.SET_SOCKET_MESSAGES](funcState: IState, data: IWSToClientData.ChatGroupMessage[]) {
        Vue.set(funcState.socketState!, "chatMessages", data);
        Vue.set(funcState, "chatMessages", data.map((element) => {
            const output: MoocChatMessage = {
                type: MoocChatMessageTypes.CHAT_MESSAGE,
                content: element
            };

            return output;
        }, [] as MoocChatMessage[]));
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
