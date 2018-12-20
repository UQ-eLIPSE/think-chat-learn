import Vue from "vue";
import { Commit } from "vuex";
import { API } from "../../../../common/js/DB_API";
import { setIdToken, getLoginResponse} from "../../../../common/js/front_end_auth";
import { IUser } from "../../../../common/interfaces/ToClientData";

export interface IState {
    idToken: string | null;
    user: IUser | null;
}

const state: IState = {
    idToken: null,
    user: null
};

const mutationKeys = {
  SET_USER: "Setting User",
};

const getters = {
    user: (): IUser | null => {
        return state.user;
    }
};
const actions = {
    setUser({ commit }: {commit: Commit}, user: IUser) {
        return commit(mutationKeys.SET_USER, user);
    },

    refreshToken() {
        return API.request(API.POST, API.USER + "me", {});
    }
};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: IUser) {
        Vue.set(funcState, "user", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
