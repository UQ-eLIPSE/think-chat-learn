

export class Logger {
    private static Console = {
        Log: console.log,
        Error: console.error
    };

    private static LoggerInstance: Logger;


    public static Get(config?: LoggerConfig) {
        if (!Logger.LoggerInstance) {
            if (!config) {
                throw new Error("No configuration options given to initialise Logger");
            }

            Logger.LoggerInstance = new Logger(config.enableLogProxy, config.enableLogInMemory, config.enableTimestamp);
        }

        return Logger.LoggerInstance;
    }

    public static Init = Logger.Get;

    public static Destroy() {
        Logger.Get().disableLogProxy();
        Logger.LoggerInstance = undefined;
    }


    private timestampOn: boolean = false;
    private logInMemory: boolean = false;

    private log: LoggerData[] = [];

    constructor(enableLogProxy: boolean = false, enableLogInMemory: boolean = false, enableTimestamp: boolean = false) {
        if (enableLogProxy) {
            this.enableLogProxy();
        }

        if (enableLogInMemory) {
            this.enableLogInMemory();
        }

        if (enableTimestamp) {
            this.enableTimestamp();
        }
    }

    private loggerProxyFactory(func: Function, type: "log" | "error") {
        return (...args: any[]) => {
            // Log arguments as they are
            if (this.logInMemory) {
                this.log.push({
                    data: args,
                    timestamp: new Date(),
                    type: type
                });
            }

            // To prevent the Array#unshift() modifying the `args` array (which would affect the log),
            // it's put through a function apply to unwrap the array.

            // Note however that any objects referenced in `args` originally are still at risk of being
            // modified, so the log may still have stuff in it that aren't preserved as it was at the
            // time of logging.
            return ((...args: any[]) => {

                // NOTE: Timestamping in the message itself can interfere with 
                // formatted console.log() output
                // This is why it is off by default
                if (this.timestampOn) {
                    args.unshift(`[${new Date().toISOString()}]`);
                }

                return func.apply(void 0, args);
            })(...args);
        }
    }

    public enableLogProxy() {
        if (console.log === Logger.Console.Log) {
            console.log = this.loggerProxyFactory(Logger.Console.Log, "log");
        }

        if (console.error === Logger.Console.Log) {
            console.error = this.loggerProxyFactory(Logger.Console.Error, "error");
        }

        return this;
    }

    public disableLogProxy() {
        // Restore
        console.log = Logger.Console.Log;
        console.error = Logger.Console.Error;

        return this;
    }

    public enableLogInMemory() {
        this.logInMemory = true;
        return this;
    }

    public disableLogInMemory() {
        this.logInMemory = false;
        return this;
    }

    public enableTimestamp() {
        this.timestampOn = true;
        return this;
    }

    public disableTimestamp() {
        this.timestampOn = false;
        return this;
    }

    public getLog() {
        return this.log;
    }

    public clearLog() {
        this.log = [];
        return this;
    }
}

export interface LoggerData {
    data: any[];
    timestamp: Date;
    type: "log" | "error";
}

export interface LoggerConfig {
    /**
     * Configures whether Logger should inject itself as proxy in console.log() and .error() functions.
     * 
     * @type {boolean}
     */
    enableLogProxy?: boolean;

    /**
     * Configures whether Logger should keep a copy of its log in memory.
     * 
     * @type {boolean}
     */
    enableLogInMemory?: boolean;

    /**
     * Configures whether Logger should prepend a timestamp for console messages.
     * 
     * Note that this may interfere with formatted console output.
     * 
     * @type {boolean}
     */
    enableTimestamp?: boolean;
}