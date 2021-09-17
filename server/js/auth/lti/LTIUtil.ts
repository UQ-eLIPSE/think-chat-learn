import oauthSignature from "oauth-signature";

import {ILTIData} from "../../../../common/interfaces/ILTIData";
import {ILTISignatureVerifyInfo} from "../../../../common/interfaces/ILTISignatureVerifyInfo";

/**
 * MOOCchat
 * LTI utilities class
 */

export class LTIUtil {
    public static validateConsumerKey(data: ILTIData, info: ILTISignatureVerifyInfo) {
        return data.oauth_consumer_key === info.consumer.key;
    }

    public static validateMessageTimestamp(data: ILTIData, varianceSec: number = 60) {
        // If no timestamp
        if (!data.oauth_timestamp) {
            return false;
        }

        return Math.abs(parseInt(data.oauth_timestamp, 10) - (Date.now() / 1000)) < varianceSec;
    }

    public static validateMessageSignature(data: ILTIData, info: ILTISignatureVerifyInfo) {
        // If no signature
        if (!data.oauth_signature || !data.oauth_signature_method) {
            return false;
        }

        // Copy data object and strip signature property out before passing to generator
        const dataCopy = LTIUtil.copyKVObject(data);
        delete dataCopy["oauth_signature"];

        const calculatedSignature = oauthSignature.generate(info.method, info.url, dataCopy, info.consumer.secret, undefined, { encodeSignature: false });

        return data.oauth_signature === calculatedSignature;
    }

    /**
     * Shallow copies a key-value object.
     */
    private static copyKVObject(obj: {[key: string]: string}) {
        const copiedObj: {[key: string]: string} = {};

        Object.keys(obj).forEach((key) => copiedObj[key] = obj[key]);

        return copiedObj;
    }
}