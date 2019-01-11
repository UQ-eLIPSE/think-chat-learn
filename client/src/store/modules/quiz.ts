import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz, TypeQuestion } from "../../../../common/interfaces/ToClientData";

export interface IState {
    quiz: IQuiz | null;
    questions: TypeQuestion[];
}

const state: IState = {
    quiz: null,
    questions: []
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUESTIONS: "Setting a question"
};

function getQuestionById(id: string): TypeQuestion | null {
    const output = state.questions.find((question) => {
        return question._id === id;
    });

    return output ? output : null;
}

const getters = {
    quiz: (): IQuiz | null => {
        return state.quiz;
    },

    questions: (): TypeQuestion[] => {
        return state.questions;
    },

    getQuestionById: () => {
        return getQuestionById;
    }
};
const actions = {
    setQuiz({ commit }: {commit: Commit}, quiz: IQuiz | null) {
        return commit(mutationKeys.SET_QUIZ, quiz);
    },

    setQuestions({ commit }: {commit: Commit}, questions: TypeQuestion[]) {
        return commit(mutationKeys.SET_QUESTIONS, questions);
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz | null) {
        Vue.set(funcState, "quiz", data);
    },

    [mutationKeys.SET_QUESTIONS](funcState: IState, data: TypeQuestion[]) {
        Vue.set(funcState, "questions", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
