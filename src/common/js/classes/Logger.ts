

export class Logger {
    private static Console = {
        Log: console.log,
        Error: console.error
    };

    private static LoggerInstance: Logger;


    public static Get(enableLogProxy: boolean = true, enableTimestamp: boolean = false) {
        if (!Logger.LoggerInstance) {
            Logger.LoggerInstance = new Logger(enableLogProxy, enableTimestamp);
            
        }

        return Logger.LoggerInstance;
    }

    public static Init = Logger.Get;

    public static Destroy() {
        Logger.Get().disableLogProxy();
        Logger.LoggerInstance = undefined;
    }


    private timestampOn: boolean = false;

    private log: LoggerData[] = [];

    constructor(enableLogProxy: boolean, enableTimestamp: boolean) {
        if (enableLogProxy) {
            this.enableLogProxy();
        }

        if (enableTimestamp) {
            this.enableTimestamp();
        }
    }

    private loggerProxyFactory(func: Function, type: "log" | "error") {
        return (...args: any[]) => {
            // Log arguments as they are
            this.log.push({
                data: args,
                timestamp: new Date(),
                type: type
            });

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
}

export interface LoggerData {
    data: any[];
    timestamp: Date;
    type: "log" | "error";
}