import Vue from "vue";
import { Commit } from "vuex";
import { IQuiz } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";
import { IQuizOverNetwork } from "../../../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz, convertNetworkQuizzesIntoQuizzes } from "../../../../common/js/NetworkDataUtils";

export interface IState {
    quiz: IQuiz[];
    course: string;
    chatGroups: any[]
}

const state: IState = {
    quiz: [],
    course: '',
    chatGroups: []
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUIZZES: "Setting a quiz",
    DELETE_QUIZ: "Deleting a quiz",
    EDIT_QUIZ: "Editing a quiz",
    SET_COURSE: "setCourse",
    SET_CHATGROUPS: "setChatGroups"
};

const getters = {
    quizzes: (): IQuiz[] | null => {
        return state.quiz;
    }
};
const actions = {
    createQuiz({ commit }: {commit: Commit}, data: IQuizOverNetwork) {
        API.request(API.PUT, API.QUIZ + "create", data).then((outcome: string) => {
            if (outcome) {
                commit(mutationKeys.SET_QUIZ, convertNetworkQuizIntoQuiz(data));
            }
        });
    },

    updateQuiz({ commit }: {commit: Commit}, data: IQuizOverNetwork) {
        API.request(API.POST, API.QUIZ + "update", data).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.EDIT_QUIZ, convertNetworkQuizIntoQuiz(data));
            }
        });
    },

    getQuizzes({ commit }: {commit: Commit}, courseId: string) {
        API.request(API.GET, API.QUIZ + "course/" + courseId, {}).then((output: IQuizOverNetwork[]) => {
            commit(mutationKeys.SET_QUIZZES, convertNetworkQuizzesIntoQuizzes(output));
        });
    },
    async getChatGroups({ commit }: {commit: Commit}, quizId: string) {
        await API.request(API.GET, API.CHATGROUP + `getChatGroups?quizid=${quizId}`, {}).then((output: any[]) => {
            commit(mutationKeys.SET_CHATGROUPS, output);
        });
    },
    setQuizzes({ commit }: {commit: Commit}, data: IQuiz[]) {
        commit(mutationKeys.SET_QUIZZES, data);
    },

    deleteQuiz({ commit }: {commit: Commit}, data: string) {
        API.request(API.DELETE, API.QUIZ + "delete/" + data, {}).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.DELETE_QUIZ, data);
            }
        });
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz) {
        Vue.set(funcState.quiz, funcState.quiz.length, data);
    },
    [mutationKeys.SET_QUIZZES](funcState: IState, data: IQuiz[]) {
        Vue.set(funcState, "quiz", data);
    },
    [mutationKeys.DELETE_QUIZ](funcState: IState, data: string) {
        const index = funcState.quiz.findIndex((element) => {
            return element._id === data;
        });

        Vue.delete(funcState.quiz, index);
    },
    [mutationKeys.EDIT_QUIZ](funcState: IState, data: IQuiz) {
        const index = funcState.quiz.findIndex((element) => {
            return element._id === data._id;
        });

        if (index !== -1) {
            Vue.set(funcState.quiz, index, data);
        }
    },
    [mutationKeys.SET_COURSE](funcState: IState, course: string) {
        funcState.course = course;
    },
    [mutationKeys.SET_CHATGROUPS](funcState: IState, chatGroups: any[]) {
        funcState.chatGroups = chatGroups;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
