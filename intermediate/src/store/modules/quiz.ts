import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz, TypeQuestion, IDiscussionPage,
    QuestionRequestData, Page } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import API from "../../../../common/js/DB_API";

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
    SET_QUESTIONS: "Setting questions"
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
      if (funcState.questions) {
          for (const question of data) {
              const index = funcState.questions.findIndex((element) => {
                  return element._id === question._id;
              });

              // Don't bother with assignment of pages if it does not exist
              if (index !== -1) {
                  Vue.set(funcState.questions, index, question);
              } else {
                  Vue.set(funcState.questions, funcState.questions.length, question);
              }

          }
      }

  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
