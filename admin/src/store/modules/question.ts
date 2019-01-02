import Vue from "vue";
import { Commit } from "vuex";
import { IQuestion } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    questions: IQuestion[];
}

const state: IState = {
    questions: []
};

const mutationKeys = {
    SET_QUESTION: "Setting a question",
    SET_QUESTIONS: "Setting questions"
};

const getters = {
    questions: (): IQuestion[] | null => {
        return state.questions;
    }
};
const actions = {
    createQuestion({ commit }: {commit: Commit}, data: IQuestion) {
        API.request(API.PUT, API.QUESTION + "create", data);
    },

    setQuestions({ commit }: {commit: Commit}, data: IQuestion[]) {
        commit(mutationKeys.SET_QUESTIONS, data);
    }
};

const mutations = {
    [mutationKeys.SET_QUESTION](funcState: IState, data: IQuestion) {
        Vue.set(funcState.questions, funcState.questions.length, data);
    },
    [mutationKeys.SET_QUESTIONS](funcState: IState, data: IQuestion[]) {
        Vue.set(funcState, "questions", data);
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
