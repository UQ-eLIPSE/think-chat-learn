import {Utils} from "../../common/js/Utils";

export const Conf = {
    server: {
        // Change url to localhost:[PORT_NUMBER] for runnning locally
        // Replace with the absolute address where moocchat server is deployed
        url: "localhost:8080"
    },
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
        reconnectionAmount: 20,
        disconnectCooloffTimeoutMs: Utils.DateTime.secToMs(0.5)
    },

    chat: {
        typingNotificationCheckMs: Utils.DateTime.secToMs(5)
    },
    pageFetchTime: 5000
};
