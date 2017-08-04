export class CountingSynchroniser {
    private count: number = 0;
    private targetCount: number;
    private done: () => void;

    constructor(targetCount: number, done: () => void) {
        this.targetCount = targetCount;
        this.done = done;
    }

    private incrementCount() {
        ++this.count;
    }

    public synchronise() {
        this.incrementCount();

        if (this.count === this.targetCount) {
            (function(done: () => void) {
                done();
            })(this.done);
        }
    }

    public generateSyncFunction() {
        return () => {
            this.synchronise();
        }
    }
}