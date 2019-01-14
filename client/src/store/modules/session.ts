import Vue from "vue";
import { Commit } from "vuex";
import { IUserSession, IQuizSession, Response } from "../../../../common/interfaces/ToClientData";
import API from "../../../../common/js/DB_API";

export interface IState {
    quizSession: IQuizSession | null;
    response: Response | null;
    currentIndex: number;
}

const state: IState = {
    quizSession: null,
    response: null,
    currentIndex: 0
};

const mutationKeys = {
    SET_QUIZ_SESSION: "Setting a quiz session",
    SET_RESPONSE: "Setting a response",
    INCREMENTING_INDEX: "Incrementing the index",
    DECREMENTING_INDEX: "Decrementing the index"
};

const getters = {
    quizSession: (): IQuizSession | null => {
        return state.quizSession;
    },

    response: (): Response | null => {
        return state.response;
    },

    currentIndex: (): number => {
        return state.currentIndex;
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
        return commit(mutationKeys.INCREMENTING_INDEX)
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
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
