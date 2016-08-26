export class OTLock {
    private _locked: boolean = false;

    public get locked() {
        return this._locked;
    }

    public lock() {
        this._locked = true;
    }
}