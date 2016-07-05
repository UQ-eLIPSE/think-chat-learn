// import * as crypto from "crypto";
import * as oauthSignature from "oauth-signature";

class NonceStore {
    private nonceToTimestamp: { [nonce: string]: number } = {};
    private lastSaveTimestamp: number;
    private noncePeriodSeconds: number;

    constructor(noncePeriodSeconds: number = 600) {
        this.noncePeriodSeconds = noncePeriodSeconds;
    }

    private get oldestTimestampToKeep() {
        return Date.now() - (this.noncePeriodSeconds * 1000);
    }

    public clean() {
        let storedNonces = Object.keys(this.nonceToTimestamp);
        let oldestTimestampToKeep = this.oldestTimestampToKeep;

        storedNonces.forEach((nonce) => {
            if (this.nonceToTimestamp[nonce] < oldestTimestampToKeep) {
                delete this.nonceToTimestamp[nonce];
            }
        });
    }

    public verifyAndStore(nonce: string) {
        let storedNonces = Object.keys(this.nonceToTimestamp);
        let oldestTimestampToKeep = this.oldestTimestampToKeep;

        // Clean if we're starting to collect old timestamps
        if (this.lastSaveTimestamp < oldestTimestampToKeep) {
            this.clean();
        }

        // Nonce not found
        if (storedNonces.indexOf(nonce) < 0) {
            this.store(nonce);
            return true;
        }

        // Nonce found + replayed = if existing nonce still valid
        if (this.nonceToTimestamp[nonce] > oldestTimestampToKeep) {
            return false;
        }

        // Nonce found + not replayed
        this.store(nonce);
        return true;
    }

    private store(nonce: string) {
        let timestamp = Date.now();
        this.nonceToTimestamp[nonce] = timestamp;
        this.lastSaveTimestamp = timestamp;
    }
}

interface ILTIData {
    // Generic
    [key: string]: any; // Generally should be string, but specified as any for safety

    // Required
    lti_message_type: string;
    lti_version: string;

    oauth_callback: string;
    oauth_consumer_key: string;
    oauth_nonce: string;
    oauth_signature: string;
    oauth_signature_method: string;
    oauth_timestamp: string;
    oauth_version: string;

    // Optional
    context_id?: string;
    context_label?: string;
    context_title?: string;
    context_type?: string;

    ext_ims_lis_memberships_id?: string;
    ext_ims_lis_memberships_url?: string;
    ext_lms?: string;

    launch_presentation_document_target?: string;
    launch_presentation_locale?: string;
    launch_presentation_return_url?: string;

    lis_course_offering_sourcedid?: string;
    lis_course_section_sourcedid?: string;
    lis_person_contact_email_primary?: string;
    lis_person_name_family?: string;
    lis_person_name_full?: string;
    lis_person_name_given?: string;
    lis_person_sourcedid?: string;

    resource_link_id?: string;
    resource_link_title?: string;

    roles?: string;

    tool_consumer_info_product_family_code?: string;
    tool_consumer_info_version?: string;
    tool_consumer_instance_contact_email?: string;
    tool_consumer_instance_description?: string;
    tool_consumer_instance_guid?: string;
    tool_consumer_instance_name?: string;
    tool_consumer_instance_url?: string;

    user_id?: string;
}

interface ILTISignatureVerifyInfo {
    method: "POST" | "GET";
    url: string;
    consumer: {
        key: string;
        secret: string;
    };
    token?: {
        // TODO:
        secret?: string;
    }
}

class LTIUtil {
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
        let dataCopy = LTIUtil.copyKVObject(data);
        delete dataCopy["oauth_signature"];

        let calculatedSignature = oauthSignature.generate(info.method, info.url, dataCopy, info.consumer.secret, void 0, { encodeSignature: false });

        return data.oauth_signature === calculatedSignature;
    }

    private static copyKVObject(obj: {[key: string]: string}) {
        let copiedObj: {[key: string]: string} = {};

        Object.keys(obj).forEach((key) => copiedObj[key] = obj[key]);

        return copiedObj;
    }
}

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

    public verifyAndCreateLTIObj(data: ILTIData) {
        // If in test mode, ignore checks
        if (this.testMode) {
            return new LTI(data);
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
        return new LTI(data);
    }
}

export class LTI {
    public data: ILTIData;

    constructor(data: ILTIData) {
        this.data = data;
    }
}