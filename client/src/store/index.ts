import Vue from "vue";
import Vuex from "vuex";
import Quiz from "./modules/quiz";
import User from "./modules/user";
import Session from "./modules/session";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        Quiz,
        User,
        Session
    }
});
