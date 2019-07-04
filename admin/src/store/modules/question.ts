import Vue from "vue";
import { Commit } from "vuex";
import { IQuestion } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";
import { TypeQuestion } from "../../../../common/interfaces/DBSchema";

export interface IState {
    questions: TypeQuestion[];
}

const state: IState = {
    questions: []
};

const mutationKeys = {
    SET_QUESTION: "Setting a question",
    SET_QUESTIONS: "Setting questions",
    DELETE_QUESTION: "Deleting a question",
    EDIT_QUESTION: "Editing a question"
};

const getters = {
    questions: (): IQuestion[] | null => {
        return state.questions;
    }
};
const actions = {
    createQuestion({ commit }: {commit: Commit}, data: IQuestion) {
        API.request(API.POST, API.QUESTION + "create", data);
    },

    setQuestions({ commit }: {commit: Commit}, data: IQuestion[]) {
        commit(mutationKeys.SET_QUESTIONS, data);
    },

    deleteQuestion({ commit }: {commit: Commit}, data: string) {
        API.request(API.DELETE, API.QUESTION + "delete/" + data, {}).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.DELETE_QUESTION, data);
            }
        });

    },

    editQuestion({ commit }: {commit: Commit}, data: IQuestion) {
        API.request(API.PUT, API.QUESTION + "update/", data).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.EDIT_QUESTION, data);
            }
        });
    }
};

const mutations = {
    [mutationKeys.SET_QUESTION](funcState: IState, data: IQuestion) {
        Vue.set(funcState.questions, funcState.questions.length, data);
    },
    [mutationKeys.SET_QUESTIONS](funcState: IState, data: IQuestion[]) {
        Vue.set(funcState, "questions", data);
    },
    [mutationKeys.DELETE_QUESTION](funcState: IState, data: string) {
        const index = funcState.questions.findIndex((element) => {
            return element._id === data;
        });

        Vue.delete(funcState.questions, index);
    }, [mutationKeys.EDIT_QUESTION](funcState: IState, data: IQuestion) {
        const index = state.questions.findIndex((element) => {
            return element._id === data._id;
        });
        Vue.set(funcState.questions, index, data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
