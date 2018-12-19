import Vue from "vue";
import { Commit } from "vuex";
import { setIdToken, getLoginResponse} from "../../../../common/js/front_end_auth";
import { IUser, IQuizSchedule } from "../../../../common/interfaces/ToClientData";

export interface IState {
    idToken: string | null;
    user: IUser | null;
    quiz: IQuizSchedule | null;
}

const state: IState = {
    idToken: null,
    user: null,
    quiz: null
};

const mutationKeys = {
  SET_USER: "Setting User",
  SET_LTI_RESPONSE: "Setting LTI Data"
};

const getters = {
    user: (): IUser | null => {
        return state.user;
    },
    quiz: (): IQuizSchedule | null => {
        return state.quiz;
    }
};
const actions = {
    setLti({ commit }: {commit: Commit}, idToken: string) {
        return commit(mutationKeys.SET_LTI_RESPONSE, idToken);
    }
};

const mutations = {
    [mutationKeys.SET_LTI_RESPONSE](funcState: IState, data: string) {
        setIdToken(data);

        const maybeResponse = getLoginResponse();
        if (maybeResponse) {
            Vue.set(funcState, "user", maybeResponse.user);
            Vue.set(funcState, "quiz", maybeResponse.quiz);
        } else {
            throw Error("Invalid token for LTI");
        }
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
