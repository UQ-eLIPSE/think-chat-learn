import Vue from "vue";
import { Commit } from "vuex";
import { IUser, IUserSession } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    user: IUser | null;
    session: IUserSession |null;
    token: string | null;
}

const state: IState = {
    user: null,
    session: null,
    token: null
};

const mutationKeys = {
  SET_USER: "Setting User",
  SET_SESSION: "Setting a session",
  STORE_TOKEN: "Storing token"
};

const getters = {
    user: (): IUser | null => {
        return state.user;
    },
    userSession: (): IUserSession | null => {
        return state.session;
    },

    token: (): string | null => {
        return state.token;
    }
};
const actions = {
    setUser({ commit }: {commit: Commit}, user: IUser) {
        return commit(mutationKeys.SET_USER, user);
    },

    refreshToken() {
        return API.request(API.POST, API.USER + "/me", {});
    },

    createSession({ commit }: { commit: Commit }, session: IUserSession) {
        return API.request(API.POST, API.USERSESSION + "/create", session, undefined,
            state.token).then((id: { outgoingId: string }) => {
            session._id = id.outgoingId;
            commit(mutationKeys.SET_SESSION, session);
        });
    },

    finishSession({ commit }: { commit: Commit }) {
        const session = state.session!;
        session.endTime = Date.now();

        return API.request(API.POST, API.USERSESSION + "/update", session, undefined,
            state.token).then((outcome: boolean) => {
            commit(mutationKeys.SET_SESSION, session);
        });
    },

    handleToken({ commit }: { commit: Commit }, token: string) {
        return API.request(API.POST, API.USER + "/handleToken", {});
    },

    storeSessionToken({ commit }: { commit: Commit }, token: string) {
        return commit(mutationKeys.STORE_TOKEN, token);
    }
};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: IUser) {
        Vue.set(funcState, "user", data);
    },

    [mutationKeys.SET_SESSION](funcState: IState, data: IUserSession) {
        Vue.set(funcState, "session", data);
    },

    [mutationKeys.STORE_TOKEN](funcState: IState, data: string) {
        Vue.set(funcState, "token", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
