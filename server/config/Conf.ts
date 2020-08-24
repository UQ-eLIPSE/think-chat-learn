import { Utils } from "../../common/js/Utils";
import { ICriteria } from "../../common/interfaces/DBSchema";
  
/**
 * MOOCchat server configuration file
 */
  
const SERVER_URL = "http://localhost:8080";
const ENDPOINT_URL = `${SERVER_URL}`;
const ADMIN_URL = "http://localhost:4000";
const CLIENT_URL = "http://localhost:3000";
const INTERMEDIATE_URL = "http://localhost:5000";

export const Conf: IConf = {
    portNum: 8080,
    database: "mongodb://mongodb:27017/moocchatDB",
    http: {
        maxSockets: 65000
    },
    // adminPage: `${SERVER_URL}/admin/#/login`,
    adminPage: `${ADMIN_URL}/admin/#/login`,
    // clientPage: `${SERVER_URL}/client/#/login`,
    clientPage: `${CLIENT_URL}/client/#/login`,
    // intermediatePage: `${SERVER_URL}/intermediate/#/login`,
    intermediatePage: `${INTERMEDIATE_URL}/intermediate/#/login`,
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
            url: "https://uthink.uqcloud.net/lti.php",
            consumer: {
                key: "moocchat.uqcloud.net",
                secret: "lti_secret_key_here"
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
        intermediateFolder:  "/../../intermediate/dist/"
    },
    // Make sure this is larger than or equal to page delay for client
    pageSlack: 10000,
    endpointUrl: ENDPOINT_URL,
    defaultCriteria: [{
        name: "evaluating",
        description: "How well one evaluates"
    }, {
        name: "interpreting",
        description: "How well one interprets"
    }, {
        name: "analysing",
        description: "How well one analyses"
    }, {
        name: "makingArguments",
        description: "How well one makes arguments"
    }, {
        name: "accuracyOfArguments",
        description: "How accurate are one's arguments"
    }, {
        name: "expressingAndResponding",
        description: "How well one expresses and responds to the prompt"
    }, {
        name: "depthOfReflection",
        description: "How well one reflects on learning outcomes"
    }, {
        name: "mark",
        description: "Your mark"
    }],
    storage: {
        useManta: false,
        mantaDetails: {
            mantaKeyLocation: "",
            mantaLocation: "",
            mantaKeyId: "",
            mantaSubUser: "",
            mantaRoles: [],
            mantaUser: "",
            mantaFolderName: ""
        },
        internalLocation: "some_location"
    }
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
    // JWT settings
    jwt: {
        SECRET: string,
        TOKEN_LIFESPAN: string
    },
    clientPage: string,
    adminPage: string,
    intermediatePage: string,
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
        intermediateFolder: string
    }
    pageSlack: number,
    endpointUrl: string,
    defaultCriteria: Partial<ICriteria>[],
    storage: {
        // If set to true, expects external location to be valid
        useManta: boolean,
        mantaDetails: {
            mantaLocation: string,
            mantaKeyLocation: string,
            mantaKeyId: string,
            mantaUser: string,
            mantaSubUser: string,
            mantaRoles: string[],
            mantaFolderName: string
        }
        internalLocation: string
    }
}