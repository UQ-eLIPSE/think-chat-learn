import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz, TypeQuestion, IDiscussionPage } from "../../../../common/interfaces/ToClientData";
import { PageType } from '../../../../common/enums/DBEnums';

export interface IState {
    quiz: IQuiz | null;
    questions: TypeQuestion[];
    currentDiscussionQuestion: TypeQuestion | null;
}

const state: IState = {
    quiz: null,
    questions: [],
    currentDiscussionQuestion: null
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUESTIONS: "Setting a question",
    SET_CURRENT_DISCUSSION: "Setting current discussion"
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
    },

    currentDiscussionQuestion: (): TypeQuestion | null => {
        return state.currentDiscussionQuestion;
    }
};
const actions = {
    setQuiz({ commit }: {commit: Commit}, quiz: IQuiz | null) {
        return commit(mutationKeys.SET_QUIZ, quiz);
    },

    setQuestions({ commit }: {commit: Commit}, questions: TypeQuestion[]) {
        return commit(mutationKeys.SET_QUESTIONS, questions);
    },

    updateCurrentDiscussion({ commit }: {commit: Commit}, index: number) {
        if (state.quiz && state.quiz.pages && state.quiz.pages[index] &&
            state.quiz.pages[index].type === PageType.DISCUSSION_PAGE) {
            return commit(mutationKeys.SET_CURRENT_DISCUSSION, (state.quiz.pages[index] as IDiscussionPage).questionId);
        }
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz | null) {
        Vue.set(funcState, "quiz", data);
    },

    [mutationKeys.SET_QUESTIONS](funcState: IState, data: TypeQuestion[]) {
        Vue.set(funcState, "questions", data);
    },

    [mutationKeys.SET_CURRENT_DISCUSSION](funcState: IState, id: string) {
        Vue.set(funcState, "currentDiscussionQuestion", getQuestionById(id));
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
