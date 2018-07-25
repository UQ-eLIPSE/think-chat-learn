// import { QuizAttempt } from "../quiz/QuizAttempt";

interface IntervalStatement {
    timeDelay: number;
    statement: string;
}

export class ChatGroupMonitor {

    private timeWindow: number;
    private intervalStatements: IntervalStatement[] = [];
    private chatGroupStartTime: number;
    private chatGroup: any;

    private currentTimeWindowMessageCount: number;

    private thresholdMessagesPerMinute: number;

    /** This number keeps track of the number of times the minimum message threshold was violated and is reset when system message is broadcasted */
    private violationCount: number;

    /** Keeps a reference to the timer so that it can be cleared later */
    private monitorTimer: NodeJS.Timer;

    /** `monitorCount` is used to reduce the number of timers needed for implementing this feature */
    private monitorCount: number = 0;

    constructor(intervalStatements: IntervalStatement[], thresholdMessagesPerMinute: number, chatGroup: any) {
        // Reversing it now to avoid shift(ing) array later
        this.intervalStatements = intervalStatements.reverse();

        console.log('Interval statements: '); console.log(this.intervalStatements)

        this.thresholdMessagesPerMinute = thresholdMessagesPerMinute;

        // 60 seconds by default
        this.timeWindow = 60 * 1000;
        this.chatGroupStartTime = Date.now();
        this.currentTimeWindowMessageCount = 0;
        this.violationCount = 0;
        this.chatGroup = chatGroup;
        this.monitor();
    }


    public registerMessage(_chatGroupMessage: any) {
        this.currentTimeWindowMessageCount++;
    }

    public resetMonitor() {
        this.currentTimeWindowMessageCount = 0;
    }

    public destroyMonitor() {
        clearTimeout(this.monitorTimer);
    }

    public monitor() {
        this.monitorTimer = setTimeout(() => { this.inspector() }, this.timeWindow / 2);
    }

    public inspector() {

        this.monitorCount++;
        // console.log('Count: ' + this.monitorCount + " | Current Message Count: " + this.currentTimeWindowMessageCount + " | Violation Count: " + this.violationCount + " | Interval statements remaining: " + this.intervalStatements.length);

        // Do nothing if there are no interval statements left
        if (!this.intervalStatements || this.intervalStatements.length < 1) {
            this.destroyMonitor();
            return;
        }

        const now = Date.now();
        // const previous = now - this.timeWindow;

        // Get the next statement
        const currentIntervalStatement = this.intervalStatements[this.intervalStatements.length - 1];


        const minimumTimeDelay = this.chatGroupStartTime + currentIntervalStatement.timeDelay;

        // if(this.lastMessageTimestamp !== undefined && this.lastMessageTimestamp > previous && this.lastMessageTimestamp < now) {
        //     this.currentTimeWindowMessageCount++;
        // }

        if (this.thresholdMessagesPerMinute > this.currentTimeWindowMessageCount) {
            this.violationCount++;
        }

        if (minimumTimeDelay < now && this.violationCount > 0) {
            // Messages can be broadcasted
            // Check if threshold was violated
            this.chatGroup.broadcastSystemMessage(this.intervalStatements.pop()!.statement);

            //reset violation count
            this.violationCount = 0;
        }

        if (this.monitorCount % 2 === 0 && this.monitorCount > 0) {
            // Check if time specified in timeWindow has passed
            this.resetMonitor();
        }

        // Create timeout again
        this.monitor();
    }
}