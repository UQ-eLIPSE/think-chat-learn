import {ILTIData} from "../../../../common/interfaces/ILTIData";

import {Conf} from "../../../config/Conf";
import {LTIProcessor} from "./LTIProcessor";
import {MoocchatAuth} from "../MoocchatAuth";

export class LTIAuth extends MoocchatAuth {
    private static Processor = new LTIProcessor(Conf.lti.signingInfo, true, Conf.lti.testMode);

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
            _authName: this.getAuthName(),

            identityId: this.ltiData.user_id,
            name: {
                full: this.ltiData.lis_person_name_full || "",
                given: this.ltiData.lis_person_name_given || "",
                family: this.ltiData.lis_person_name_family || "",
            },
            course: this.ltiData.context_label || "",
            roles: this.ltiData.roles.split(","),
        }
    }
}