import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz, TypeQuestion, IDiscussionPage,
    QuestionRequestData, Page } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import API from "../../../../common/js/DB_API";
import { TCLStateMessageTypes } from "@/enums";
import { TimerSettings } from "@/interfaces";

export interface IState {
  quiz: IQuiz | null;
  questions: TypeQuestion[];
  currentDiscussionQuestion: TypeQuestion | null;
  // The difference between the two indices is that the currentIndex is what should be
  // rendered and max is what pages can be rendered
  currentIndex: number;
  maxIndex: number;
}

const state: IState = {
  quiz: null,
  questions: [],
  currentDiscussionQuestion: null,
  currentIndex: 0,
  maxIndex: 0
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUESTIONS: "Setting questions",
    SET_CURRENT_DISCUSSION: "Setting current discussion",
    SET_PAGES: "Setting the pages",
    // Current page settings
    INCREMENTING_CURRENT_INDEX: "Incrementing the current index",
    DECREMENTING_CURRENT_INDEX: "Decrementing the current index",
    SET_CURRENT_INDEX: "Sets the current index",
    INCREMENTING_MAX_INDEX: "Incrementing the max index",
    SET_MAX_INDEX: "Setting the max index"
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
  },

  currentIndex: (): number => {
    return state.currentIndex;
  },

  maxIndex: (): number => {
    return state.maxIndex;
  },

  currentTimerSettings: (): TimerSettings | null => {
    if (!state.quiz || !state.quiz.pages || !state.quiz.pages[state.maxIndex]) {
      return null;
    }

    const output: TimerSettings = {
      referencedPageId: state.quiz.pages[state.maxIndex]._id!,
      timeoutInMins: state.quiz.pages[state.maxIndex].timeoutInMins
    };

    return output;
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

            commit(mutationKeys.SET_CURRENT_DISCUSSION, (state.quiz.pages[index] as IDiscussionPage).questionId);

            return commit("Appending a state message",
                { incomingState: TCLStateMessageTypes.NEW_DISCUSSION_QUESTION, message:
                `New discussion point. Please discuss about ${state.quiz.pages[index]!.title}`});
        }
    },

  incrementCurrentIndex({ commit }: { commit: Commit }) {
    return commit(mutationKeys.INCREMENTING_CURRENT_INDEX);
  },

  setCurrentIndex({ commit }: { commit: Commit }, pageNumber: number) {
    return commit(mutationKeys.SET_CURRENT_INDEX, pageNumber);
  },

  decrementCurrentIndex({ commit }: { commit: Commit }) {
    return commit(mutationKeys.DECREMENTING_CURRENT_INDEX);
  },

  incrementMaxIndex({ commit }: {commit: Commit}) {
      return commit(mutationKeys.INCREMENTING_MAX_INDEX);
  },

  getPage({ commit }: {commit: Commit}, data: any) {
      return API.request(API.POST, API.USER + "page/", data).then((output: QuestionRequestData | null) => {
          if (!output) {
              return false;
          }

          // Store the pages and possibly the question
          state.quiz!.pages![state.maxIndex + 1] = output.page;
          commit(mutationKeys.SET_QUIZ, state.quiz);
          const question = output.question;
          if (question) {
              // Find the reference
              state.questions.forEach((element, index) => {
                  if (element._id === question._id) {
                      state.questions[index] = question;
                  }
              });

              commit(mutationKeys.SET_QUESTIONS, state.questions);
          }

          return true;
      });
  }
};

const mutations = {
  [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz | null) {
    Vue.set(funcState, "quiz", data);
  },

    [mutationKeys.SET_PAGES](funcState: IState, data: Page[]) {
        if (funcState.quiz && funcState.quiz.pages) {
            for (let i = 0 ; i < data.length; i++) {
                const index = funcState.quiz.pages.findIndex((element) => {
                    return element._id === data[i]._id;
                });

                // Push if not there
                if (index !== -1) {
                    Vue.set(funcState.quiz.pages, index, data[i]);
                } else {
                    Vue.set(funcState.quiz.pages, funcState.quiz.pages.length, data[i]);
                }

            }
        }
    },

    [mutationKeys.SET_QUESTIONS](funcState: IState, data: TypeQuestion[]) {
        if (funcState.questions) {
            for (let i = 0 ; i < data.length; i++) {
                const index = funcState.questions.findIndex((element) => {
                    return element._id === data[i]._id;
                });

                // Don't bother with assignment of pages if it does not exist
                if (index !== -1) {
                    Vue.set(funcState.questions, index, data[i]);
                } else {
                    Vue.set(funcState.questions, funcState.questions.length, data[i]);
                }

            }
        }

    },

  [mutationKeys.SET_CURRENT_DISCUSSION](funcState: IState, id: string) {
    Vue.set(funcState, "currentDiscussionQuestion", getQuestionById(id));
  },

  [mutationKeys.INCREMENTING_CURRENT_INDEX](funcState: IState) {
    Vue.set(funcState, "currentIndex", funcState.currentIndex + 1);
  },

  [mutationKeys.DECREMENTING_CURRENT_INDEX](funcState: IState) {
    Vue.set(funcState, "currentIndex", funcState.currentIndex - 1);
  },

  [mutationKeys.SET_CURRENT_INDEX](funcState: IState, data: number) {
    Vue.set(funcState, "currentIndex", data);
  },

  [mutationKeys.INCREMENTING_MAX_INDEX](funcState: IState) {
    Vue.set(funcState, "maxIndex", funcState.maxIndex + 1);
  },

  [mutationKeys.SET_MAX_INDEX](funcState: IState, index: number) {
    Vue.set(funcState, "maxIndex", index);
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
