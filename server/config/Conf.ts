import { Utils } from "../../common/js/Utils";

/**
 * MOOCchat server configuration file
 */

export const Conf: IConf = {
    portNum: 8080,
    database: "mongodb://localhost:27017/moocchatDB",
    http: {
        maxSockets: 65000
    },
    socketIo: {
        pingInterval: 5000,
        pingTimeout: 16000
    },
    express: {
        serveStaticContent: true
    },
    lti: {
        testMode: true,
        signingInfo: {
            method: "POST",
            url: "https://mc-stg.uqcloud.net/lti.php",
            consumer: {
                key: "moocchat.uqcloud.net",
                secret: "q3npRzgGi7yQRbcK73lw"
            }
        }
    },
    piwik: {
        url: "https://elipse-analytics.uqcloud.net/piwik",
        siteId: 2
    },
    chat: {
        groups: {
            desiredSize: 3,
            formationIntervalMs: Utils.DateTime.secToMs(1),
        }
    },
    backupClient: {
        callConfirmTimeoutMs: 15000
    },
    session: {
        timeoutMs: Utils.DateTime.hrsToMs(1),
    },
}


/**
 * Explicit definition for above config file
 * 
 * @interface IConf
 */
interface IConf {
    portNum: number,
    database: string,
    http: {
        maxSockets: number
    },
    socketIo: {
        pingInterval: number,
        pingTimeout: number
    },
    express: {
        serveStaticContent: boolean
    },
    lti: {
        testMode: boolean,
        signingInfo: {
            method: "GET" | "POST",
            url: string,
            consumer: {
                key: string,
                secret: string
            }
        }
    },
    piwik: {
        url: string,
        siteId: number
    },
    chat: {
        groups: {
            desiredSize: number,
            formationIntervalMs: number,
        }
    },
    backupClient: {
        callConfirmTimeoutMs: number
    },
    session: {
        timeoutMs: number,
    }
}
