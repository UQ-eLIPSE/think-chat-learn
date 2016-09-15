import {ILTIData} from "./ILTIData";

import {ServerConf} from "../../conf/ServerConf";
import {LTIProcessor} from "./LTIProcessor";
import {MoocchatAuth} from "../MoocchatAuth";

export class LTIAuth extends MoocchatAuth {
    private static Processor = new LTIProcessor(ServerConf.lti.signingInfo, true, ServerConf.lti.testMode);

    private ltiData: ILTIData;

    constructor(ltiData: ILTIData) {
        super("LTI");
        this.ltiData = ltiData;
    }

    public isValid() {
        return {
            result: true,
            message: ""
        };
    }

    public isAuthenticated() {
        try {
            LTIAuth.Processor.verifyAndReturnLTIObj(this.ltiData);
        } catch (e) {
            return {
                result: false,
                message: e.message,
            };
        }

        return {
            result: true,
            message: ""
        };
    }

    public getIdentity() {
        return {
            identityId: this.ltiData.user_id,
            name: {
                full: this.ltiData.lis_person_name_full || "",
                given: this.ltiData.lis_person_name_given || "",
                family: this.ltiData.lis_person_name_family || "",
            },
            authName: this.getAuthName(),
            course: this.ltiData.context_label || "",
            roles: this.ltiData.roles.split(","),
        }
    }
}