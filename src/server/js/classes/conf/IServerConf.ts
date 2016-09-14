export interface IServerConf {
    "portNum": number,
    "database": string,
    "http": {
        "maxSockets": number
    },
    "socketIo": {
        "pingInterval": number,
        "pingTimeout": number
    },
    "express": {
        "serveStaticContent": boolean
    },
    "lti": {
        "testMode": boolean,
        "signingInfo": {
            "method": "GET" | "POST",
            "url": string,
            "consumer": {
                "key": string,
                "secret": string
            }
        }
    },
    "piwik": {
        "url": string,
        "siteId": number
    },
    "chat": {
        "groups": {
            "desiredSize": number,
            "formationIntervalMs": number,
            "formationTimeoutMs": number
        }
    },
    "backupClient": {
        "callConfirmTimeoutMs": number
    }
}