import {Utils} from "../js/Utils";

export const Conf = {
    server: {
        // Change url to localhost:[PORT_NUMBER] for runnning locally
        // Replace with the absolute address where moocchat server is deployed
        url: "localhost:8080"
    },    
    pacSeqSocket: {
        resendIntervalMs: 2000
    },

    answers: {
        justification: {
            maxLength: 500
        }
    },
    websockets: {
        reconnectionAmount: 20,
        disconnectCooloffTimeoutMs: Utils.DateTime.secToMs(0.5)
    },
    timings: {
        initialAnswerMs: Utils.DateTime.secToMs(10 * 60),
        discussionMs: Utils.DateTime.secToMs(15 * 60),
        chatGroupFormationTimeoutMs: Utils.DateTime.minToMs(1),
        revisedAnswerMs: Utils.DateTime.secToMs(6 * 60)
    },
};
