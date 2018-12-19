import Vue from "vue";
import { Commit } from "vuex";
import { FrontEndUser } from "../../../../common/interfaces/User";
import { API } from "../../../../common/js/DB_API";
import { setIdToken, getCurrentUser } from "../../../../common/js/auth";
export interface IState {
    user: FrontEndUser | null;
    idToken: string | null;
}

const state: IState = {
    user: null,
    idToken: null,
};

const mutationKeys = {
  SET_USER: "Setting User"
};

const getters = {
    user: (): FrontEndUser | null => {
        return state.user;
    }
};
const actions = {
    login({ commit }: {commit: Commit}, idToken: string) {
        commit("LOGIN", idToken);
        return commit(mutationKeys.SET_USER, getCurrentUser());
    },
    someAction() {
        // TODO have session actually function
        return API.request(API.POST, "session/lti", {});
    }
};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: FrontEndUser) {
        Vue.set(funcState, "user", data);
    },
    ["LOGIN"](funcState: IState, idToken: string) {
        setIdToken(idToken);
        Vue.set(funcState, "idToken", idToken);
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};
