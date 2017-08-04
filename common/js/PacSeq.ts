import {IPacSeqQueuedObj} from "../interfaces/IPacSeqQueuedObj";

export class PacSeq {
    private sequence: number = -1;

    private queued: IPacSeqQueuedObj[] = [];

    /**
     * Pops off all queued objects up to and including `lastAck`.
     */
    public flush(lastAck: number) {
        while (this.nextQueuedObj()) {
            // Flush out acknowledged packets
            if (this.nextQueuedObj().seq <= lastAck) {
                this.queued.shift();
                continue;
            }
            
            // If we still have queued packets not yet acknowledged,
            // then stop and let the system refetch this later. 
            break;
        }
    }

    /**
     * Puts `data` into sequence queue and returns the sequence number.
     */
    public queue(data: any) {
        const seq = this.increment();

        this.queued.push({
            timestamp: new Date(),
            seq: seq,
            data: data,
        });

        return seq;
    }

    /**
     * Increments and returns new sequence number.
     */
    private increment() {
        const seq = ++this.sequence;

        if (seq >= 9007199254740991) {
            throw new Error("Sequence number limit reached");
        }

        return seq;
    }

    private nextQueuedObj() {
        return this.queued[0];
    }


    /**
     * Returns the next queued data.
     */
    public next() {
        const obj = this.nextQueuedObj();

        if (!obj) {
            return;
        }

        return obj.data;
    }
}
