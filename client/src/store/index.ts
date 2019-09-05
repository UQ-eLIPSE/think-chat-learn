import Vue from "vue";
import Vuex from "vuex";
import Quiz from "./modules/quiz";
import User from "./modules/user";
import Session from "./modules/session";

Vue.use(Vuex);

export interface GlobalState {
    systemMessage: SystemMessage;
}

export enum SystemMessageTypes {
    FATAL_ERROR = "FATAL_ERROR",
    WARNING = "WARNING",
    SUCCESS = "SUCCESS"
}

const mutationKeys = {
    SET_GLOBAL_MESSAGE: "SET_GLOBAL_MESSAGE",
    RESET_GLOBAL_MESSAGE: "RESET_GLOBAL_MESSAGE"
};

export interface SystemMessage {
    error: boolean;
    message: null | string;
    type: SystemMessageTypes | null;
    expiry: number | null;
}

export default new Vuex.Store<GlobalState>({
    state: {
        systemMessage: {
            error: false,
            message: null,
            type: null,
            expiry: null
        }
    },
    mutations: {
        [mutationKeys.SET_GLOBAL_MESSAGE](funcState: GlobalState, data: SystemMessage) {
            Vue.set(funcState, "systemMessage", data);
            if (data.expiry !== null && Number.isInteger(data.expiry)) {
                setTimeout(() => {
                    if (data === funcState.systemMessage) {
                        // Check if the same message is still set as systemMessage
                        Vue.set(funcState, "systemMessage", {
                            error: false,
                            type: null,
                            expiry: null,
                            message: null
                        });
                    }

                }, data.expiry);
            }
        },
        [mutationKeys.RESET_GLOBAL_MESSAGE](funcState: GlobalState, data: SystemMessage) {
            Vue.set(funcState, "systemMessage", {
                error: false,
                type: null,
                expiry: null,
                message: null
            });
        },
    },
    modules: {
        Quiz,
        User,
        Session
    }
});
