// import { QuizAttempt } from "../quiz/QuizAttempt";

interface IntervalStatement {
    timeDelay: number;
    statement: string;
}

// export class ChatGroupMonitor {
//     // 60 seconds by default
//     private windowDuration: number = 60;
//     private lastTriggerMessage: any;
//     private intervals: IntervalStatement[] = [];
//     private quizAttempts: QuizAttempt[];
//     private thresholdViolatedCount: number;
//     private currentTimeWindowMessageCount: number = 0;
//     private movingWindowInterval: any;
//     private startTime: number;
//     private windowStartTime: number;
//     /** Stores the required threshold for the number of chat messages sent in the group (per minute) */
//     private thresholdMessagesPerMinute: number;

//     constructor(intervals: IntervalStatement[], threshold: number, quizAttempts: QuizAttempt[]) {
//         console.log('Starting Chat Group Monitor . . .');
//         this.startTime = Date.now();

//         this.intervals = intervals;
//         this.thresholdViolatedCount = 0;
//         this.quizAttempts = quizAttempts;

//         this.thresholdMessagesPerMinute = threshold;
//         this.initMonitor();
//     }

//     registerMessage(chatGroupMessage: any) {
//         this.currentTimeWindowMessageCount++;
//         this.lastTriggerMessage = chatGroupMessage;
//     }

//     initMonitor() {
//         const movingWindowInterval = setInterval(() => {
//             const currentTime = Date.now();
//             this.windowStartTime = currentTime;
//             console.log('Checking message count . . .')
//             const previous = currentTime - this.windowDuration * 1000;
//             if (this.lastTriggerMessage && this.lastTriggerMessage.timestamp >= previous && this.lastTriggerMessage.timestamp <= currentTime) {
//                 this.currentTimeWindowMessageCount++;
//             } else {
//                 this.thresholdViolatedCount++;
//             }



//             if (this.intervals.length > 0 && (this.intervals[0].timeDelay + this.startTime) <= currentTime && this.currentTimeWindowMessageCount < this.thresholdMessagesPerMinute) {
//                 // broadcast message
//                 console.log('Violated Count . . .');
//                 this.thresholdViolatedCount = 0;
//                 this.currentTimeWindowMessageCount = 0;
//                 const messageObject = this.intervals.shift();
//                 this.broadcastSystemMessage(messageObject!.statement);
//             }

//         }, this.windowDuration / 2 * 1000);

//         this.movingWindowInterval = movingWindowInterval;
//     }

//     public broadcast(event: string, data: any) {
//         this.quizAttempts.forEach((quizAttempt) => {

//             const socket = quizAttempt.getUserSession().getSocket();

//             if (socket) {
//                 socket.emit(event, data);
//             }
//         });
//     }

//     public broadcastSystemMessage(message: string) {
//         const systemMessage = {
//             message: message,
//             timestamp: Date.now()
//         };
//         this.broadcast("chatGroupSystemMessage", systemMessage);
//     }

//     public destroyMonitor() {
//         clearInterval(this.movingWindowInterval);
//     }
// }

export class ChatGroupMonitor {

    private timeWindow: number;
    private intervalStatements: IntervalStatement[] = [];
    private chatGroupStartTime: number;
    private chatGroup: any;

    // private lastMessageTimestamp: number;
    private currentTimeWindowMessageCount: number;
    private thresholdMessagesPerMinute: number;
    /** This number keeps track of the number of times the minimum message threshold was violated and is reset when system message is broadcasted */
    private violationCount: number;

    /** Keeps a reference to the timer so that it can be cleared later */
    private monitorIntervalTimer: NodeJS.Timer;

    // private monitorResetTimer: NodeJS.Timer;

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
        this.startMonitor();
    }

    startMonitor() {
        
        let count = 0;

        // const resetTimer = setInterval(() => {
        //     this.resetMonitor();
        // }, this.timeWindow);

        const timer = setInterval(() => {

            count++;
            console.log('Count: ' + count + " | Current Message Count: " + this.currentTimeWindowMessageCount + " | Violation count: " + this.violationCount + " | Interval statements remaining: " + this.intervalStatements.length);

            // Do nothing if there are no interval statements left
            if (this.intervalStatements.length < 1) {
                this.destroyMonitor();
                return;
            }
            const now = Date.now();
            // const previous = now - this.timeWindow;
            // Get the next interval statement
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

            if(count % 2 === 0) {
                // Check if time specified in timeWindow has passed
                this.resetMonitor();
            }
        }, this.timeWindow / 2);

        // Set timers
        // this.monitorResetTimer = resetTimer;
        this.monitorIntervalTimer = timer;

    }

    public registerMessage(_chatGroupMessage: any) {
        this.currentTimeWindowMessageCount++;
        // this.lastMessageTimestamp = chatGroupMessage.timestamp;
    }

    public resetMonitor() {
        this.currentTimeWindowMessageCount = 0;
    }

    public destroyMonitor() {
        clearInterval(this.monitorIntervalTimer);
        // clearInterval(this.monitorResetTimer);
    }
}