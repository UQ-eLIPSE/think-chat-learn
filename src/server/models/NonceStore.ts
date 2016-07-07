export class NonceStore {
    private nonceToTimestamp: { [nonce: string]: number } = {};
    private lastSaveTimestamp: number;
    private noncePeriodSeconds: number;

    private lastCleanTime: number = 0;

    constructor(noncePeriodSeconds: number = 600) {
        this.noncePeriodSeconds = noncePeriodSeconds;
    }

    private get oldestTimestampToKeep() {
        return Date.now() - (this.noncePeriodSeconds * 1000);
    }

    public clean() {
        // Don't clean too frequently (roughly every ~this.noncePeriodSeconds)
        if (this.lastCleanTime > this.oldestTimestampToKeep) {
            return;
        }

        let storedNonces = Object.keys(this.nonceToTimestamp);
        let oldestTimestampToKeep = this.oldestTimestampToKeep;

        storedNonces.forEach((nonce) => {
            if (this.nonceToTimestamp[nonce] < oldestTimestampToKeep) {
                delete this.nonceToTimestamp[nonce];
            }
        });

        this.lastCleanTime = Date.now();
    }

    public verifyAndStore(nonce: string) {
        let storedNonces = Object.keys(this.nonceToTimestamp);
        let oldestTimestampToKeep = this.oldestTimestampToKeep;

        this.clean();

        // Nonce not found
        if (storedNonces.indexOf(nonce) < 0) {
            this.store(nonce);
            return true;
        }

        // Nonce found + replayed = if existing nonce still valid
        if (this.nonceToTimestamp[nonce] > oldestTimestampToKeep) {
            return false;
        }

        // Nonce found + not replayed within active timeframe
        this.store(nonce);
        return true;
    }

    private store(nonce: string) {
        let timestamp = Date.now();
        this.nonceToTimestamp[nonce] = timestamp;
        this.lastSaveTimestamp = timestamp;
    }
}