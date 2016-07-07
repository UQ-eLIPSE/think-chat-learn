import {LTIUtil} from "./LTIUtil";

import {ILTIData} from "../models/ILTIData";
import {ILTISignatureVerifyInfo} from "../models/ILTISignatureVerifyInfo";
import {NonceStore} from "../models/NonceStore";

export class LTIProcessor {
    private nonceStore: NonceStore;
    private signingInfo: ILTISignatureVerifyInfo;
    private testMode: boolean = false;

    constructor(signingInfo: ILTISignatureVerifyInfo, enableNonceStore: boolean = true) {
        this.signingInfo = signingInfo;

        if (enableNonceStore) {
            this.nonceStore = new NonceStore();
        }
    }

    public setTestMode(value: boolean) {
        this.testMode = value;
    }

    public verifyAndReturnLTIObj(data: ILTIData) {
        // If in test mode, ignore checks
        if (this.testMode) {
            return data;
        }

        if (!LTIUtil.validateConsumerKey(data, this.signingInfo)) {
            throw new Error("LTI data consumer key invalid or mismatching");
        }

        if (!LTIUtil.validateMessageTimestamp(data)) {
            throw new Error("LTI data timestamp invalid or stale");
        }

        if (this.nonceStore && !this.nonceStore.verifyAndStore(data.oauth_nonce)) {
            throw new Error("LTI data nonce invalid or replayed");
        }

        if (!LTIUtil.validateMessageSignature(data, this.signingInfo)) {
            throw new Error("LTI data signature invalid");
        }

        // If all pass, then return new LTI
        return data;
    }
}