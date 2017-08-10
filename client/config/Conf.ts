import {Utils} from "../../common/js/Utils";

export const Conf = {
    taskTimer: {
        outOfTimeRemainingMs: Utils.DateTime.secToMs(60)
    },

    combinedHTML: {
        // Relative to URL of public page (not server filesystem path)
        url: "./static/combined-html/all-pages.html"
    },

    virtServer: {
        maxRealServerTimeoutMs: Utils.DateTime.secToMs(5)
    },

    websockets: {
        disconnectCooloffTimeoutMs: Utils.DateTime.secToMs(0.5)
    },

    chat: {
        typingNotificationCheckMs: Utils.DateTime.secToMs(5)
    }
}
