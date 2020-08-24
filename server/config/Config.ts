import dotenv from 'dotenv';

/**
 * Utility Class for configuration parsing
 */
abstract class Config {
  /**
   * Return the configuration object as loaded from the `.env` file
   * @param envFilePath Path of .env file to be loaded and parsed
   */
  static get(envFilePath?: string): { success: boolean, payload: ServerConfiguration | null, message?: string } {
    try {
      const dotEnv = dotenv.config({
        path: envFilePath
      });
      if (!dotEnv) throw new Error('.env file could not be parsed');
      if (dotEnv.error) throw new Error(dotEnv.error.message);
      if (!dotEnv.parsed) throw new Error('.env file could not be parsed');
      if (!Config.isConfigValid(dotEnv.parsed)) throw new Error('Configuration error => .env file');
      return {
        success: true,
        payload: Config.generateConfigObject(dotEnv.parsed),
        message: 'Configuration loaded successfully'
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
        payload: null
      };
    }
  }

  static isValidEnv(env: any): boolean {
    return (
      env === NODE_ENVS.development ||
      env === NODE_ENVS.production ||
      env === NODE_ENVS.testing
    );
  }

  /**
   *
   * @param key name of the config variable
   * @param actualValue value parsed from the .env file / custom
   */
  static _testIfConfigTypeMatches(key: keyof ServerConfiguration, actualValue: string): boolean {
    if (!ExpectedConfig[key] || !ExpectedConfig[key].type || !key) return false;

    // If configuration is optional and falsy
    if (ExpectedConfig[key].optional && !actualValue) return true;

    // If configuration is not optional and falsy
    if (!actualValue) return false;

    switch (ExpectedConfig[key].type) {
      case 'number':
        return typeof parseFloat(actualValue) === ExpectedConfig[key].type;
      case 'string':
        return typeof actualValue === ExpectedConfig[key].type;
      case 'boolean':
        const isBoolean = actualValue === 'true' || actualValue === 'false';
        return isBoolean;
      default:
        return false;
    }
  }

  static isConfigValid(parsedConfig: dotenv.DotenvParseOutput): boolean {
    return (Object.keys(ExpectedConfig) as Array<keyof ServerConfiguration>).every((config) => {
      if (!Config._testIfConfigTypeMatches(config, parsedConfig[config])) {
        console.error(`Config error: ${config} does not match expected type ${ExpectedConfig[config].type}`);
      }
      return Config._testIfConfigTypeMatches(config, parsedConfig[config]);
    });
  }

  static generateConfigObject(parsedConfiguration: dotenv.DotenvParseOutput): ServerConfiguration {
    return Object.keys(parsedConfiguration).reduce((compiledConfig, configKey) => {
      const ExpectedConfigObject = ExpectedConfig[configKey as keyof ServerConfiguration];
      if (!ExpectedConfigObject || !ExpectedConfigObject.type) return compiledConfig;
      switch (ExpectedConfigObject.type) {
        case 'number':
          return Object.assign(compiledConfig, { [configKey]: parseFloat(parsedConfiguration[configKey]) });
        case 'string':
          return Object.assign(compiledConfig, { [configKey]: parsedConfiguration[configKey] });
        case 'boolean':
          const value = parsedConfiguration[configKey] === 'true' ? true : false;
          return Object.assign(compiledConfig, { [configKey]: value });
        default:
          return compiledConfig;
      }
    }, {} as ServerConfiguration);
  }
}



/**
 * 
 * #########################################
 * ============ Types and Enums ============
 * #########################################
 * 
 */

export const NODE_ENVS = {
  development: 'development',
  production: 'production',
  testing: 'testing'
};



/**
 * Maps `Configuration` interface types to `ExpectedConfig`.
 * Makes sure that static types provided by Typescript and runtime
 * types defined in `ExpectedConfig` are consistent with each other.
 */
type MappedConfigType<I, K extends keyof I> = {
  type: I[K] extends number ? 'number' : I[K] extends string ?
  'string' :
  I[K] extends string ? 'string' :
  I[K] extends boolean ? 'boolean' : never;
  optional?: boolean;
};

export interface ServerConfiguration {
  NODE_ENV: string;
  SERVER_URL: string;
  ENDPOINT_URL: string;
  ADMIN_URL: string;
  CLIENT_URL: string;
  INTERMEDIATE_URL: string;
  PORT: number;
  DATABASE_URI: string;

  LTI_TEST_MODE: boolean;
  LTI_METHOD: string;
  LTI_CONSUME_URL: string;
  LTI_CONSUMER_KEY: string;
  LTI_SHARED_SECRET: string;

  JWT_SECRET: string;
  JWT_TOKEN_LIFESPAN: string;

  HTTP_MAX_SOCKETS: number;

  SOCKET_PING_INTERVAL: number;
  SOCKET_PING_TIMEOUT: number;

  SERVE_STATIC_CONTENT: boolean;
  CLIENT_RELATIVE_FOLDER: string;
  ADMIN_RELATIVE_FOLDER: string;
  INTERMEDIATE_RELATIVE_FOLDER: string;

  MANTA_ENABLED: boolean;
  MANTA_URL: string;
  MANTA_KEY_LOCATION: string;
  MANTA_KEY_ID: string;
  MANTA_USER: string;
  MANTA_SUBUSER: string;
  MANTA_ROLES: string;
  MANTA_FOLDER_PATH: string;
  IMAGE_UPLOAD_LOCAL_PATH: string;

  GROUP_DESIRED_SIZE: number;
  GROUP_FORMATION_INTERVAL_MS: number;
  PAGE_SLACK: number;
}

/**
 * Contains the .env variables are expected in the .env file and their respective types
 * Used for runtime configuration type checking
 * E.g. If PORT is set as `abc`, this will help identify that error
 */
export const ExpectedConfig
  : { [key in keyof ServerConfiguration]: MappedConfigType<ServerConfiguration, key> }
  = {
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
};

export interface CommonConfiguration {

}
// Load dotenv without type checking

// Load configuration
const configRes = Config.get(__dirname + '/../../server.env');

console.log('###### SERVER CONFIG: ', configRes.payload);
const commonDotEnv = dotenv.config({
  // path: __dirname +  '/../../common.env'
  path: __dirname +  '/../../common.env'
});
if (!commonDotEnv) throw new Error('.env file could not be parsed');
if (commonDotEnv.error) throw new Error(commonDotEnv.error.message);
if (!commonDotEnv.parsed) throw new Error('.env file could not be parsed');

console.log('#######################SERVER COMMON CONFIG ERR: ###################', commonDotEnv.parsed);
console.log('#######################SERVER COMMON CONFIG: ###################', commonDotEnv.parsed);
if (!configRes || !configRes.success || !configRes.payload) {
  console.error(configRes.message);
  process.exit(1);
}

export default { ...configRes.payload, ...commonDotEnv.parsed } as ServerConfiguration & CommonConfiguration;