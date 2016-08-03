import {Utils} from "./classes/Utils";

export const conf = {
    timings: {
        initialAnswerMs: Utils.DateTime.secToMs(15 * 60),
        discussionMs: Utils.DateTime.secToMs(15 * 60),
        revisedAnswerMs: Utils.DateTime.secToMs(6 * 60) 
    },

    taskTimer: {
        outOfTimeRemainingMs: Utils.DateTime.secToMs(60)
    },

    answers: {
        justification: {
            maxLength: 500
        }
    },

    combinedHTML: {
        // Relative to URL of public page (not server filesystem path)
        url: "./static/combined-html/all-pages.html"
    }
}
