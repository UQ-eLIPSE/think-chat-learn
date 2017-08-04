export type ErrorThrowFunc = (e: Error) => void;
export type NextFunc = () => void;
export type CallbackChainElem = (throwErr: ErrorThrowFunc, next: NextFunc) => void;

export class CallbackChainer {
    private functions: CallbackChainElem[];

    constructor(functions: CallbackChainElem[]) {
        this.functions = functions;
    }

    public run(errorThrowFunc: ErrorThrowFunc) {
        let chainIndex = -1;
        let errorThrown = false;

        const throwErr = (err: Error) => {
            errorThrown = true;
            errorThrowFunc(err);
            return;
        }

        const callbackChainer = () => {
            const nextCallback = this.functions[++chainIndex];
            if (errorThrown || !nextCallback) { return; }

            nextCallback(throwErr, callbackChainer);
        };

        callbackChainer();
    }
}