import { Utils } from "../../common/js/Utils";
 
/**
 * MOOCchat server configuration file
 */
 
export const Conf: IConf = {
    endpointUrl: "https://uthink.uqcloud.net/api",
    portNum: 8080,
    database: "mongodb://localhost:27017/moocchatDB",
    http: {
        maxSockets: 65000
    },
    adminPage: "https://elipse-deep-001.uqcloud.net/admin/#/login",
    clientPage: "https://elipse-deep-001.uqcloud.net/client/#/login",
    jwt: {
        SECRET: "YOUR_SECRET",
        TOKEN_LIFESPAN: "7h"
    },
    socketIo: {
        pingInterval: 5000,
        pingTimeout: 16000
    },
    express: {
        serveStaticContent: false
    },
    lti: {
        testMode: false,
        signingInfo: {
            method: "POST",
            url: "https://uthink.uqcloud.net/lti.php",
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
    folders: {
        clientFolder: "/../client/",
        adminFolder:  "/../admin/"
    },
    pageSlack: 10000
}
 
 
/**
 * Explicit definition for above config file
 *
 * @interface IConf
 */
interface IConf {
    endpointUrl: string,
    portNum: number,
    database: string,
    http: {
        maxSockets: number
    },
    // JWT settings
    jwt: {
        SECRET: string,
        TOKEN_LIFESPAN: string
    },
    clientPage: string,
    adminPage: string,
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
    },
    folders: {
        clientFolder: string,
        adminFolder: string
    },
    pageSlack: number
}