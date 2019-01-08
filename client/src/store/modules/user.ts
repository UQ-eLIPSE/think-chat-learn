import Vue from "vue";
import { Commit } from "vuex";
import { IUser, IUserSession } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    user: IUser | null;
    session: IUserSession |null ;
}

const state: IState = {
    user: null,
    session: null
};

const mutationKeys = {
  SET_USER: "Setting User",
  SET_SESSION: "Setting a session"
};

const getters = {
    user: (): IUser | null => {
        return state.user;
    },
    userSession: (): IUserSession | null => {
        return state.session;
    }
};
const actions = {
    setUser({ commit }: {commit: Commit}, user: IUser) {
        return commit(mutationKeys.SET_USER, user);
    },

    refreshToken() {
        return API.request(API.POST, API.USER + "me", {});
    },

    createSession({ commit }: { commit: Commit }, session: IUserSession) {
        return API.request(API.PUT, API.USERSESSION + "create", session).then((outcome: boolean) => {
            commit(mutationKeys.SET_SESSION, session);
        });
    },

    finishSession({ commit }: { commit: Commit }, session: IUserSession) {
        return API.request(API.POST, API.USERSESSION + "update", session).then((outcome: boolean) => {
            commit(mutationKeys.SET_SESSION, session);
        });
    }
};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: IUser) {
        Vue.set(funcState, "user", data);
    },
    [mutationKeys.SET_SESSION](funcState: IState, data: IUserSession) {
        Vue.set(funcState, "session", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
