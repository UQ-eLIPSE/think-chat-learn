import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    quiz: IQuiz | null;
}

const state: IState = {
    quiz: null
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz"
};

const getters = {
    quiz: (): IQuiz | null => {
        return state.quiz;
    }
};
const actions = {
    createQuiz({ commit }: {commit: Commit}, data: IQuiz) {
        API.request(API.PUT, API.QUIZ + "create", data);
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz) {
        Vue.set(funcState, "quiz", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
