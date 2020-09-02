import Vue from "vue";
import { Commit } from "vuex";
import { IUser } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";
export interface IState {
    user: IUser | null;
}

const state: IState = {
    user: null
};

const mutationKeys = {
  SET_USER: "Setting User"
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
    handleToken({ commit }: { commit: Commit}, token: string) {
        return API.request(API.POST, API.USER + "handleToken", {});
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
