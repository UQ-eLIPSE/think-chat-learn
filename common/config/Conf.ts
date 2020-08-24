import {Utils} from '../js/Utils';

// const SERVER_URL = http://localhost:8080;
// const CLIENT_URL = `${SERVER_URL}/client/`;

const expectedConfiguration = {
    VUE_APP_PACSEQSOCKET_RESEND_INTERVAL_MS: true,
    VUE_APP_MAX_ANSWER_INPUT_LENGTH: true,
    VUE_APP_WEBSOCKETS_RECONNECTION_AMOUNT: true,
    VUE_APP_GROUP_FORMATION_TIMEOUT_MINS: true,
    VUE_APP_GROUP_DEFAULT_SIZE: true,
    VUE_APP_CLIENT_URL: true,
    VUE_APP_SERVER_URL: true
}

Object.keys(expectedConfiguration).forEach((configKey) => {
    if(!process.env[`${configKey}`]) throw new Error(`Missing configuration value ${configKey}`);
});

export const Conf = {
    server: {
        // Change url to localhost:[PORT_NUMBER] for runnning locally
        // Replace with the absolute address where server is deployed
        url: `${process.env.VUE_APP_SERVER_URL!}`
    },
    pacSeqSocket: {
        resendIntervalMs: parseInt(`${process.env.VUE_APP_PACSEQSOCKET_RESEND_INTERVAL_MS!}`)
    },

    answers: {
        justification: {
            maxLength: parseInt(`${process.env.VUE_APP_MAX_ANSWER_INPUT_LENGTH!}`)
        }
    },
    
    websockets: {
        // Connection attempt has been reduced from 20 to 5.
        reconnectionAmount: parseInt(`${process.env.VUE_APP_WEBSOCKETS_RECONNECTION_AMOUNT!}`),
        // disconnectCooloffTimeoutMs: Utils.DateTime.secToMs(0.5)
    },
    timings: {
        // initialAnswerMs: Utils.DateTime.secToMs(10 * 60),
        // discussionMs: Utils.DateTime.secToMs(15 * 60),
        chatGroupFormationTimeoutMs: Utils.DateTime.minToMs(parseFloat(`${process.env.VUE_APP_GROUP_FORMATION_TIMEOUT_MINS!}`)),
        // revisedAnswerMs: Utils.DateTime.secToMs(6 * 60)
    },

    groups: {
        defaultGroupSize: parseInt(`${process.env.VUE_APP_GROUP_DEFAULT_SIZE!}`)
    },
    client: {
        url: `${process.env.VUE_APP_CLIENT_URL!}`
    }
    // admin: {
    //     imageLocation: ADMIN_IMAGE_LOCATION
    // }
};
