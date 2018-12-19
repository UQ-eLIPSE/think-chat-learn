import Vue from "vue";
import { Commit } from "vuex";
import { IQuizSchedule } from "../../../../common/interfaces/ToClientData";

export interface IState {
    quiz: IQuizSchedule | null;
}

const state: IState = {
    quiz: null
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz"
};

const getters = {
    quiz: (): IQuizSchedule | null => {
        return state.quiz;
    }
};
const actions = {
    setQuiz({ commit }: {commit: Commit}, quiz: IQuizSchedule) {
        return commit(mutationKeys.SET_QUIZ, quiz);
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuizSchedule) {
        Vue.set(funcState, "quiz", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
