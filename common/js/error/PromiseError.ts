export class AbortChainError extends Error {
    static ContinueAbort(err: any) {
        if (err instanceof AbortChainError) {
            throw err;
        }
    }
}