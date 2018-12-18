import Vue from "vue";
import { Commit } from "vuex";
import { FrontEndUser } from "../../../../common/interfaces/User";

export interface IState {
    user: FrontEndUser;
    idToken: string;
}

const state: IState = {
    user: {
        id: "-1",
        firstname: "Person",
        surname: "Person",
        username: "s123456",
        researchConsent: false
    },
    idToken: ""
};

const mutationKeys = {
  SET_USER: "Setting User"
};

const getters = {
    user: (): FrontEndUser => {
        return state.user;
    }
};
const actions = {
    login({ commit }: {commit: Commit}, idToken: string) {
        return commit("LOGIN", idToken);
    },
};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: FrontEndUser) {
        Vue.set(funcState, "user", data);
    },
    ["LOGIN"](funcState: IState, idToken: string) {
        Vue.set(funcState, "idToken", idToken);
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
