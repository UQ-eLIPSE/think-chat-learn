import {LTIUtil} from "./LTIUtil";

import {ILTIData} from "../../../../common/interfaces/ILTIData";
import {ILTISignatureVerifyInfo} from "../../../../common/interfaces/ILTISignatureVerifyInfo";
import {NonceStore} from "./NonceStore";

/**
 * MOOCchat
 * LTI processing class
 */

export class LTIProcessor {
    private nonceStore: NonceStore;
    private signingInfo: ILTISignatureVerifyInfo;
    private testMode: boolean;

    constructor(signingInfo: ILTISignatureVerifyInfo, enableNonceStore: boolean = true, testMode: boolean = false) {
        this.signingInfo = signingInfo;

        if (enableNonceStore) {
            this.nonceStore = new NonceStore();
        }

        this.setTestMode(testMode);
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
            throw new Error("[40] LTI data consumer key invalid or mismatching");
        }

        if (!LTIUtil.validateMessageTimestamp(data)) {
            throw new Error("[41] LTI data timestamp invalid or stale");
        }

        if (this.nonceStore && !this.nonceStore.verifyAndStore(data.oauth_nonce)) {
            throw new Error("[42] LTI data nonce invalid or replayed");
        }

        if (!LTIUtil.validateMessageSignature(data, this.signingInfo)) {
            throw new Error("[43] LTI data signature invalid");
        }

        // If all pass, then return new LTI
        return data;
    }
}