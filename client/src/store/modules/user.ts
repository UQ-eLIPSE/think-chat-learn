import Vue from "vue";
import { Commit } from "vuex";
import { FrontEndUser } from "../../../../common/interfaces/User";

export interface IState {
    user: FrontEndUser;
}

const state: IState = {
    user: {
        id: "-1",
        firstname: "Person",
        surname: "Person",
        username: "s123456",
        researchConsent: false
    }
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

};

const mutations = {
    [mutationKeys.SET_USER](funcState: IState, data: FrontEndUser) {
        Vue.set(funcState, "user", data);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
