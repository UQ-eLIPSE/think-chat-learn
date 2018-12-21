import Vue from "vue";
import { Commit } from "vuex";
import { FrontEndQuiz } from "../../../../common/interfaces/Quiz";
import { IQuiz } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";
export interface IState {
    quizzes: FrontEndQuiz[];
}

const state: IState = {
    quizzes: []
};

const mutationKeys = {
    SET_QUIZZES: "Setting list of quizzes",
    SET_QUIZ: "Setting a quiz"
};

const getters = {
    quizzes: (): FrontEndQuiz[] => {
        return state.quizzes;
    }
};
const actions = {
    createQuiz({ commit }: {commit: Commit}, data: IQuiz) {
    }
};

const mutations = {
    [mutationKeys.SET_QUIZZES](funcState: IState, data: FrontEndQuiz[]) {
        Vue.set(funcState, "quizzes", data);
    },
    [mutationKeys.SET_QUIZ](funcState: IState, data: { quiz: FrontEndQuiz, index: number }) {
        Vue.set(funcState.quizzes, data.index, data.quiz);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
