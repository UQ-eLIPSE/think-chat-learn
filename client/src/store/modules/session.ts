import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response, IQuiz,
    IDiscussionPage,
    TypeQuestion,
    QuestionReconnectData,
    LoginResponseTypes} from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

// Websocket interfaces
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { WebsocketManager } from "../../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../../common/js/WebsocketEvents";
// Common typings/utils
import { SocketState, Message, StateMessage, Dictionary } from "../../interfaces";
import { MessageTypes, StateMessageTypes } from "../../enums";
import { logout, getLoginResponse } from "../../../../common/js/front_end_auth";
import store, { SystemMessageTypes } from "..";
import { Utils } from "../../../../common/js/Utils";
import { PageType, QuestionType } from "../../../../common/enums/DBEnums";
import { ChatGroupResync } from "../../../../common/interfaces/HTTPToClientData";
import { IResponseMCQ, IResponseQualitative } from "../../../../common/interfaces/DBSchema";
import * as CommonConf from "../../../../common/config/Conf";
export interface IState {
    quizSession: IQuizSession | null;
    // Note the key of this dictionary would be the questionid as we simply respond to one question
    responses: Dictionary<Response>;
    socketState: SocketState;
    chatMessages: Message[];
    resyncAmount: number;
    // Stops the browser
    stopBrowser: boolean;
    // Tells a resync to a page
    resync: boolean;
    // Tells if the quiz session is available
    quizAvailable: boolean;
    // Tells if a quizSession has been feteched (attempted)
    quizSessionFetched: boolean;
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
    resyncAmount: 0,
    stopBrowser: false,
    resync: false,
    quizAvailable: false,
    quizSessionFetched: false
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    ADD_RESPONSE: "Adding a response",
    ADD_RESPONSES: "Adding multiple responses",
    POPULATE_MISSING_RESPONSES: "Populate missing responses",
    // Web socket mutations
    CREATE_SOCKET: "Creating the socket",
    CLOSE_SOCKET: "Closing the socket",
    DELETE_SOCKET: "Deleting the socket",
    // Chat message mutations
    APPEND_STATE_MESSAGE: "Appending a state message",
    SET_GROUP: "Setting the chat group",
    SET_SOCKET_MESSAGES: "Setting the socket messages",
    SET_QUIZ_AVAILABILITY: "Setting quiz availability",
    // Sets a feteched message state
    SET_FETCH_STATE: "Setting fetch state"
};

// Handles reconnect message fail messages by noting this on the store
function reconnectFail() {
    store.commit("SET_GLOBAL_MESSAGE", {
        error: true,
        type: SystemMessageTypes.FATAL_ERROR,
        message:
            "Error: Connection lost. Please close current window/tab and launch Think.Chat.Learn again from Blackboard. " +
                "(Your progress will be retained)"
      });
      alert("Error: Connection lost. Please close current window/tab and launch Think.Chat.Learn again from Blackboard. " +
      "(Your progress will be retained)");
}

// To be displayed when socket.io cannot reconnect.
// Attemptnumber is passed by socket.io
function reconnectAttempt(attemptNumber: number) {
    store.commit("SET_GLOBAL_MESSAGE", {
        error: false,
        type: SystemMessageTypes.WARNING,
        message: `Connection lost.
            Attempting to reconnect (#${attemptNumber}/${CommonConf.Conf.websockets.reconnectionAmount})`
      });
    
}

// Grabs the reference from user.ts
function getToken(): string | null {
    return store.getters.token;
}

async function handleGroupJoin(data?: IWSToClientData.ChatGroupFormed) {
    if (!data) {
        throw Error("No data for group join");
    }

    // Note the use of global state usage
    Vue.set(state.socketState, "chatGroupFormed", data);

    // Handle a join
    const joinMessage: StateMessage = {
        state: StateMessageTypes.ON_JOIN,
        type: MessageTypes.STATE_MESSAGE,
        message: `Joined a group of ${data.groupSize} you are Student ${data.clientIndex}`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, joinMessage);
    await store.dispatch("updateGroup", data);
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
    const chatMessage: Message = {
        type: MessageTypes.CHAT_MESSAGE,
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
        state: StateMessageTypes.CHAT_GROUP_LEAVE,
        type: MessageTypes.STATE_MESSAGE,
        message: `Student ${data.clientIndex} has disconnected`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, stateMessage);
}

function handleChatGroupReconnect(data?: IWSToClientData.ChatGroupReconnect) {
    if (!data) {
        throw Error("No data for chat groups");
    }

    const stateMessage: StateMessage = {
        state: StateMessageTypes.CHAT_GROUP_RECONNECT,
        type: MessageTypes.STATE_MESSAGE,
        message: `Student ${data.clientIndex} has reconnected`
    };

    Vue.set(state.chatMessages, state.chatMessages.length, stateMessage);
}

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

    // Handles the terminate of the socket
    state.socketState.socket!.on(WebsocketEvents.INBOUND.TERMIANTE_BROWSER, handleTermination);
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
            }, undefined, getToken())).data;

            // A fetch was attempted regardless
            store.commit(mutationKeys.SET_FETCH_STATE, true);

            // If we have a quiz session assign it else, do nothing
            if (!quizSession) {
                return;
            }

            store.dispatch("updateQuizSession", quizSession);

            if (quizSession.complete) {
                store.commit("SET_GLOBAL_MESSAGE", {
                    error: true,
                    type: SystemMessageTypes.WARNING,
                    expiry: null,
                    message: "You have already attempted the quiz"
                });
            }
        } else {
            return;
        }
    } else {
        // Presumably the state store's version is valid
        quizSession = state.quizSession;
    }
    // We have a quiz session (whether it is an on client disconnect or not)
    // The next step is to check for our socket session
    const socketPresent: { outcome: boolean } = await API.request(API.POST, API.QUIZSESSION + "findSession",
        state.quizSession!, undefined, getToken());

    if (socketPresent.outcome) {
        store.commit("SET_GLOBAL_MESSAGE", {
            error: false,
            type: SystemMessageTypes.SUCCESS,
            expiry: 2000,
            message: "Connected"
          });
        // Notify the server of a resync
        state.socketState!.socket!.emit(WebsocketEvents.OUTBOUND.SESSION_SOCKET_RESYNC, {
            quizSessionId: state.quizSession!._id
        });
    } else {
        // If we have a quiz session but not registered in terms of socket, need to check if intermediate
        const token = getLoginResponse();

        if (token && token.type === LoginResponseTypes.BACKUP_LOGIN) {
            state.socketState!.socket!.emit(WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET,
                {
                  quizSessionId: state.quizSession!._id!
                });

        } else {
            // No present socket session present. Don't bother with reconnection. This could possibly mean that the
            // server has gone down or the socket session has been garbage collected


            // TODO: Check if quiz completed
            if (quizSession !== null && quizSession.complete) {
                // Quiz already completed
                return;
            } else {
                // TODO: Set error message since socket reconnection failed
                const error = {
                    error: true,
                    type: SystemMessageTypes.FATAL_ERROR,
                    expiry: null,
                    message:
                        "Error: Connection could not be established. " +
                        "Please close current window/tab and launch Think.Chat.Learn again from Blackboard. " +
                        "(Your progress will be retained)"
                };

                store.commit("SET_GLOBAL_MESSAGE", error);
                return;
            }
        }
    }
    // Fetch the group based on quiz id. If we don't have one.
    if (!state.socketState!.chatGroupFormed) {
        const groupSession: ChatGroupResync | null =
            await API.request(API.POST, API.CHATGROUP +
                "recoverSession", state.quizSession!);

        const userResponses: Response[] =
            (await API.request(API.GET, API.RESPONSE + "quizSession/" + state.quizSession!._id, {},
                undefined, getToken())).data;

        const quizQuestionData: QuestionReconnectData = await API.request(API.POST, API.USER + "/reconnectData", {
            quizId: state.quizSession!.quizId,
            quizSessionId: state.quizSession!._id,
            groupId: groupSession && groupSession.chatGroupFormed.groupId ?
                groupSession.chatGroupFormed.groupId : null
        });

        // Set the things as a result
        await store.commit("Setting the pages", quizQuestionData.pages);
        await store.commit("Setting questions", quizQuestionData.questions);

        if (groupSession) {
            await handleGroupJoin(groupSession.chatGroupFormed);
            await store.dispatch("updatePageBasedOnTime", { time: groupSession.startTime, isGroup: true });
            await store.dispatch("updateSocketMessages", groupSession.messages);
        } else {
            await store.dispatch("updatePageBasedOnTime", { time: quizSession!.startTime, isGroup: false });
        }

        if (userResponses) {
            await store.commit(mutationKeys.ADD_RESPONSES, userResponses);
            // Populate the missing responses based on the maxIndex
            await store.commit(mutationKeys.POPULATE_MISSING_RESPONSES);
        }
    }

    Vue.set(state, "resync", true);

    // We then check if the quiz session has a group id and notify everyone
    if (state.socketState!.chatGroupFormed) {
        setTimeout(() => state.socketState!.socket!.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_RECONNECT, {
            quizSessionId: state.quizSession!._id,
            groupId: state.socketState!.chatGroupFormed!.groupId }
        ), 1000);
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

    chatMessages: (): Message[] => {
        return state.chatMessages;
    },

    resyncAmount: (): number => {
        return state.resyncAmount;
    },

    stopBrowser: (): boolean => {
        return state.stopBrowser;
    },

    resync: (): boolean => {
        return state.resync;
    },

    quizAvailable: (): boolean => {
        return state.quizAvailable;
    },

    quizSessionFetched: (): boolean => {
        return state.quizSessionFetched;
    }
};
const actions = {
    createQuizSession({ commit }: {commit: Commit}, quizSession: IQuizSession) {
        return API.request(API.POST, API.QUIZSESSION + "create", quizSession, undefined,
            getToken()).then((id: { outgoingId: string }) => {

            quizSession._id = id.outgoingId;
            commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
            return id.outgoingId;
        });
    },

    updateQuizSession({ commit }: {commit: Commit}, quizSession: IQuizSession) {
        commit(mutationKeys.SET_QUIZ_SESSION, quizSession);
    },

    retrieveQuizSession({ commit }: { commit: Commit }, id: string) {
        return API.request(API.GET, API.QUIZSESSION + "quizsession/" + id, {}, undefined,
            getToken()).then((data:
            { session: IQuizSession }) => {

            commit(mutationKeys.SET_QUIZ_SESSION, data.session);
            return data;
        });
    },

    sendResponse({ commit }: {commit: Commit}, response: Response) {
        return API.request(API.POST, API.RESPONSE + "create", response, undefined,
            getToken()).then((id: { outgoingId: string}) => {

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

    updatePageBasedOnTime({ commit }: {commit: Commit}, data: { time: number, isGroup: boolean } ) {
        // Given a quiz, compute the amount of time for each page.
        const currentTime = Date.now();
        let trackedTime = data.time;
        const quiz: IQuiz | null = store.getters.quiz;
        if (!quiz || !quiz.pages) {
            return;
        }


        // Since the group formation occurs at the first discussion, we iterate from there
        let firstDiscussionIndex = quiz.pages.findIndex((element) => {
            return element.type === PageType.DISCUSSION_PAGE;
        });

        if (firstDiscussionIndex === -1) {
            // Solve the case in which we have no discussion at all
            firstDiscussionIndex = quiz.pages.length;
        }

        // Our bounds are based whether or not we are doing this for a group or not
        const lowerIndex = data.isGroup ? firstDiscussionIndex : 0;
        const upperIndex = data.isGroup ? quiz.pages.length : firstDiscussionIndex;

        let i = 0;

        for (i = lowerIndex ; i < upperIndex; i++) {
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
                break;
            }

            trackedTime = upperBound;
        }

        if (i === quiz.pages.length) {
            // If we somehow reach there then the max index would be
            // at the page lengths
            store.commit("Sets the current index", i);
            store.commit("Setting the max index", i);
        }
    },

    setAvailability({ commit }: {commit: Commit}, isAvailable: boolean) {
        if (isAvailable) {
            commit(mutationKeys.SET_QUIZ_AVAILABILITY);
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

    [mutationKeys.ADD_RESPONSES](funcState: IState, data: Response[]) {
        data.forEach((element) => {
            Vue.set(funcState.responses,  element.questionId!, element);
        });
    },

    [mutationKeys.CREATE_SOCKET](funcState: IState) {
        if (!funcState.socketState.socket) {
            Vue.set(funcState.socketState, "socket",
                    new WebsocketManager(handleReconnect, reconnectFail, reconnectAttempt));
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

    [mutationKeys.APPEND_STATE_MESSAGE](funcState: IState, data: { incomingState: StateMessageTypes,
        message: string }) {

        const outgoingMessage: StateMessage = {
            type: MessageTypes.STATE_MESSAGE,
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
            const output: Message = {
                type: MessageTypes.CHAT_MESSAGE,
                content: element
            };

            return output;
        }, [] as Message[]));
    },

    [mutationKeys.SET_FETCH_STATE](funcState: IState, data: boolean) {
        Vue.set(funcState, "quizSessionFetched", data);
    },

    [mutationKeys.POPULATE_MISSING_RESPONSES](funcState: IState) {
        // The idea is given the max index and quiz. Generate missing responses
        const maxIndex: number = store.getters.maxIndex;
        const quiz: IQuiz | null = store.getters.quiz;
        const questions: TypeQuestion[] = store.getters.questions;

        if (quiz && quiz.pages) {
            const relevantQuestions = quiz.pages.reduce((arr: string[], element, index) => {
                if ((element.type === PageType.QUESTION_ANSWER_PAGE) && index < maxIndex) {
                    arr.push(element.questionId);
                }
                return arr;
            }, []);

            relevantQuestions.forEach((questionId) => {
                const questionType = (questions.find((element) => {
                    return element._id === questionId;
                })!).type;

                if (!funcState.responses[questionId]) {
                    let sampleResponse;
                    if (questionType === QuestionType.QUALITATIVE) {
                        sampleResponse = {
                            confidence: 1,
                            questionId,
                            quizId: quiz._id!,
                            quizSessionId: funcState.quizSession!._id!,
                            type: QuestionType.QUALITATIVE,
                            content: "No response given"
                        } as IResponseQualitative ;
                    } else {
                        sampleResponse = {
                            confidence: 1,
                            questionId,
                            quizId: quiz._id!,
                            quizSessionId: funcState.quizSession!._id!,
                            type: QuestionType.MCQ,
                            optionId: "A"
                        } as IResponseMCQ;
                    }

                    Vue.set(funcState.responses, sampleResponse.questionId, sampleResponse);
                }
            });
        }

    },

    [mutationKeys.SET_QUIZ_AVAILABILITY](funcState: IState) {
        Vue.set(funcState, "quizAvailable", true);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
