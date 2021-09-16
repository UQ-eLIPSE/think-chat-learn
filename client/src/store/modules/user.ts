import Vue from "vue";
import { Commit } from "vuex";
import { IUser, IUserSession } from "../../../../common/interfaces/ToClientData";
import { API } from "../../../../common/js/DB_API";

export interface IState {
    user: IUser | null;
    session: IUserSession |null;
    token: string | null;
    courseTitle?: string;
}

const state: IState = {
    user: null,
    session: null,
    token: null,
    courseTitle: ""
};

const mutationKeys = {
  SET_USER: "Setting User",
  SET_SESSION: "Setting a session",
  STORE_TOKEN: "Storing token",
  SET_USER_COURSE_TITLE: "Setting user's course's title"
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
    },
    userCourseTitle: (): string => {
        return state.courseTitle || "";
    }
};
const actions = {
    setUser({ commit }: {commit: Commit}, user: IUser) {
        return commit(mutationKeys.SET_USER, user);
    },

    setUserCourseTitle({ commit }: {commit: Commit}, courseTitle?: string) {
        return commit(mutationKeys.SET_USER_COURSE_TITLE, courseTitle);
    },

    refreshToken() {
        return API.request(API.POST, API.USER + "me", {});
    },

    createSession({ commit }: { commit: Commit }, session: IUserSession) {
        return API.request(API.POST, API.USERSESSION + "create", session, undefined,
            state.token).then((id: { outgoingId: string }) => {
            session._id = id.outgoingId;
            commit(mutationKeys.SET_SESSION, session);
        });
    },

    finishSession({ commit }: { commit: Commit }) {
        const session = state.session!;
        session.endTime = Date.now();

        return API.request(API.PUT, API.USERSESSION + "update", session, undefined,
            state.token).then((outcome: boolean) => {
            commit(mutationKeys.SET_SESSION, session);
        });
    },

    handleToken({ commit }: { commit: Commit }, token: string) {
        return API.request(API.POST, API.USER + "handleToken", {});
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
    },
    [mutationKeys.SET_USER_COURSE_TITLE](funcState: IState, data: string) {
        Vue.set(funcState, "courseTitle", data || "");
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
