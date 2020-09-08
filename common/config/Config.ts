export const ExpectedCommonConfig = {
    VUE_APP_PACSEQSOCKET_RESEND_INTERVAL_MS: {
        type: 'number'
    },

    VUE_APP_WEBSOCKETS_RECONNECTION_AMOUNT: {
        type: 'number'
    },

    VUE_APP_GROUP_DEFAULT_SIZE: {
        type: 'number'
    },
    VUE_APP_GROUP_FORMATION_TIMEOUT_MINS: {
        type: 'number'
    },

    VUE_APP_MAX_ANSWER_INPUT_LENGTH: {
        type: 'number'
    },
    VUE_APP_MAX_CHAT_INPUT_LENGTH: {
        type: 'number'
    },

    VUE_APP_SERVER_URL: {
        type: 'string'
    },
    VUE_APP_CLIENT_URL: {
        type: 'string'
    }
} as const;
