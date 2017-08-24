import {Utils} from "../js/Utils";

export const Conf = {
    pacSeqSocket: {
        resendIntervalMs: 2000
    },

    answers: {
        justification: {
            maxLength: 500
        }
    },

    timings: {
        initialAnswerMs: Utils.DateTime.secToMs(10 * 60),
        discussionMs: Utils.DateTime.secToMs(15 * 60),
        chatGroupFormationTimeoutMs: Utils.DateTime.minToMs(5),
        revisedAnswerMs: Utils.DateTime.secToMs(6 * 60) 
    },
}
