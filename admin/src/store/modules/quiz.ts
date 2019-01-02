import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    quiz: IQuiz[];
}

const state: IState = {
    quiz: []
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUIZZES: "Setting a quizzes"
};

const getters = {
    quiz: (): IQuiz[] | null => {
        return state.quiz;
    }
};
const actions = {
    createQuiz({ commit }: {commit: Commit}, data: IQuiz) {
        API.request(API.PUT, API.QUIZ + "create", data);
    },

    getQuizzes({ commit }: {commit: Commit}, courseId: string) {
        API.request(API.GET, API.QUIZ + "course/" + courseId, {}).then((output: IQuiz[]) => {
            commit(mutationKeys.SET_QUIZZES, output);
        });
    },

    setQuizzes({ commit }: {commit: Commit}, data: IQuiz[]) {
        commit(mutationKeys.SET_QUIZZES, data);
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz) {
        Vue.set(funcState.quiz, funcState.quiz.length, data);
    },
    [mutationKeys.SET_QUIZZES](funcState: IState, data: IQuiz[]) {
        Vue.set(funcState, "quiz", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
