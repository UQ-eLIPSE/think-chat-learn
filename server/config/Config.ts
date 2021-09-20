import dotenv from 'dotenv';
import ConfigValidator, { MappedConfigType } from '../../common/util/ConfigValidator';
import { ExpectedCommonConfig } from '../../common/config/Config';

/**
 * Contains the .env variables are expected in the .env file and their respective types
 * Used for runtime configuration type checking
 * 
 * Note: `as const` is known as a "const assertion". This feature was added in TypeScript 3.4.
 * Essentially, using `as const` does the following:
 * * No literal types in the literal expression are widened
 * * Object literals will get readonly properties.
 * 
 * This is used to map expected configuration types to server configuration type used system-wide
 * 
 */
export const ExpectedServerConfig = {
  NODE_ENV: { type: 'string' },

  SERVER_URL: { type: 'string' },
  ENDPOINT_URL: { type: 'string' },
  ADMIN_URL: { type: 'string' },
  CLIENT_URL: { type: 'string' },
  INTERMEDIATE_URL: { type: 'string' },
  PORT: { type: 'number' },
  DATABASE_URI: { type: 'string' },

  LTI_TEST_MODE: { type: 'boolean' },
  LTI_METHOD: { type: 'string' },
  LTI_CONSUME_URL: { type: 'string' },
  LTI_CONSUMER_KEY: { type: 'string' },
  LTI_SHARED_SECRET: { type: 'string' },

  JWT_SECRET: { type: 'string' },
  JWT_TOKEN_LIFESPAN: { type: 'string' },

  HTTP_MAX_SOCKETS: { type: 'number' },

  SOCKET_PING_INTERVAL: { type: 'number' },
  SOCKET_PING_TIMEOUT: { type: 'number' },

  SERVE_STATIC_CONTENT: { type: 'boolean' },
  CLIENT_RELATIVE_FOLDER: { type: 'string' },
  ADMIN_RELATIVE_FOLDER: { type: 'string' },
  INTERMEDIATE_RELATIVE_FOLDER: { type: 'string' },

  MANTA_ENABLED: { type: 'boolean' },
  MANTA_URL: { type: 'string' },
  MANTA_KEY_LOCATION: { type: 'string' },
  MANTA_KEY_ID: { type: 'string' },
  MANTA_USER: { type: 'string' },
  MANTA_SUBUSER: { type: 'string' },
  MANTA_ROLES: { type: 'string' },
  MANTA_FOLDER_PATH: { type: 'string' },
  IMAGE_UPLOAD_LOCAL_PATH: { type: 'string' },

  GROUP_DESIRED_SIZE: { type: 'number' },
  GROUP_FORMATION_INTERVAL_MS: { type: 'number' },
  PAGE_SLACK: { type: 'number' },
} as const;

export type ServerConfiguration = {[key in keyof typeof ExpectedServerConfig]: MappedConfigType<typeof ExpectedServerConfig, key, typeof ExpectedServerConfig[key]>};
export type CommonConfiguration = {[key in keyof typeof ExpectedCommonConfig]: MappedConfigType<typeof ExpectedCommonConfig, key, typeof ExpectedCommonConfig[key]>};

export function readConfigFiles() {
  try {
    const serverDotEnv = dotenv.config({
      path: __dirname +  '/../../server.env'
    });
  
    const commonDotEnv = dotenv.config({
      path: __dirname +  '/../../common.env'
    });
  
    if(!serverDotEnv || !commonDotEnv) throw new Error('server.env could not be parsed');
  
    const serverConfig: ServerConfiguration = ConfigValidator
      .validateAndParseConfigWithExpectedConfig<typeof ExpectedServerConfig, ServerConfiguration>(serverDotEnv.parsed, ExpectedServerConfig);
  
    const commonConfig: CommonConfiguration = ConfigValidator
      .validateAndParseConfigWithExpectedConfig<typeof ExpectedCommonConfig, CommonConfiguration>(commonDotEnv.parsed, ExpectedCommonConfig);
  
    return { success: true, payload: { ...serverConfig, ...commonConfig } };
  } catch(e) {
    return { success: false, message: e.message }
  }
}

const configParsedResponse = readConfigFiles();

if(!configParsedResponse || !configParsedResponse.success || !configParsedResponse.payload) {
  console.error('\n\n========== Configuration error encountered ==========',
    '\nPlease fix specified error(s):\n\t', configParsedResponse.message,
    '\n=====================================================\n\n');
  process.exit(1);
}


console.log('\n========== Configuration loaded ==========\n');
export default configParsedResponse.payload;