import Vue from "vue";
import { Commit } from "vuex";
import { IUser } from "../../../../common/interfaces/ToClientData";

export interface IState {
    user: IUser | null;
}

const state: IState = {
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
