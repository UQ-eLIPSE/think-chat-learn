import {Utils} from '../js/Utils';
import { ExpectedCommonConfig } from './Config';


Object.keys(ExpectedCommonConfig).forEach((configKey) => {
    if(process.env[`${configKey}`] === undefined) throw new Error(`Missing configuration value ${configKey}`);
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
    },
    timings: {

        chatGroupFormationTimeoutMs: Utils.DateTime.minToMs(parseFloat(`${process.env.VUE_APP_GROUP_FORMATION_TIMEOUT_MINS!}`)),

    },

    groups: {
        defaultGroupSize: parseInt(`${process.env.VUE_APP_GROUP_DEFAULT_SIZE!}`)
    },
    client: {
        url: `${process.env.VUE_APP_CLIENT_URL!}`
    }
};
