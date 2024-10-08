import { ILTIData } from "../../../../common/interfaces/ILTIData";
import { IMoocchatAuthProcessReturn } from "../IMoocchatAuthProcessReturn";
import { IMoocchatIdentityInfo } from "../IMoocchatIdentityInfo";

import Config from "../../../config/Config";
import { LTIProcessor } from "./LTIProcessor";
import { MoocchatAuth } from "../MoocchatAuth";

export class LTIAuth extends MoocchatAuth {
    private static Processor = new LTIProcessor({ 
        method: Config.LTI_METHOD as any,
        url: Config.LTI_CONSUME_URL,
        consumer: {
            key: Config.LTI_CONSUMER_KEY,
            secret: Config.LTI_SHARED_SECRET
        }
    }, true, Config.LTI_TEST_MODE);


    private ltiData: ILTIData;

    constructor(ltiData: ILTIData) {
        super("LTI");
        this.ltiData = ltiData;
    }

    public isValid() {
        return {
            success: true
        };
    }

    public isAuthenticated(): IMoocchatAuthProcessReturn {
        try {
            LTIAuth.Processor.verifyAndReturnLTIObj(this.ltiData);
        } catch (e) {
            return {
                success: false,
                message: e.message,
            };
        }

        return {
            success: true
        };
    }

    public getIdentity(): IMoocchatIdentityInfo {
        if (!this.ltiData.user_id) {
            throw new Error("No user ID available for use");
        }

        return {
            _authName: this.getAuthName(),

            identityId: this.ltiData.user_id,
            name: {
                full: this.ltiData.lis_person_name_full || "",
                given: this.ltiData.lis_person_name_given || "",
                family: this.ltiData.lis_person_name_family || "",
            },
            course: this.ltiData.context_label || "",
            courseTitle: this.ltiData.context_title || "",
            roles: (this.ltiData.roles || "").split(","),
        }
    }
}