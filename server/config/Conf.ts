import { Utils } from "../../common/js/Utils";

/**
 * MOOCchat server configuration file
 */

export const Conf: IConf = {
    endpointUrl: "http://localhost:8080",
    portNum: 8080,
    database: "mongodb://localhost:27017/moocchatDB",
    http: {
        maxSockets: 65000
    },
    adminPage: "http://localhost:8080/admin/#/login",
    clientPage: "http://localhost:8080/client/#/login",
    intermediatePage: "http://localhost:8080/intermediate/#/login",
    jwt: {
        SECRET: "YOUR_SECRET",
        TOKEN_LIFESPAN: "7h"
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
                secret: "secret"
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
        clientFolder: "/../../client/dist/",
        adminFolder:  "/../../admin/dist/",
        intermediateFolder: "/../../intermediate/dist/",
        markingFolder: "/../../admin/static"
    },
    // Make sure this is larger than or equal to page delay for client
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
    intermediatePage: string,
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
        adminFolder: string,
        intermediateFolder: string,
        markingFolder: string
    }
    pageSlack: number
}