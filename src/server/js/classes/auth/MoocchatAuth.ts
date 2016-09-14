import {IMoocchatIdentityInfo} from "./IMoocchatIdentityInfo";
import {IMoocchatAuthProcessReturn} from "./IMoocchatAuthProcessReturn";

/**
 * 
 * 
 * @export
 * @abstract
 * @class MoocchatAuth
 */
export abstract class MoocchatAuth {
    private authName: string;

    /**
     * Creates an instance of MoocchatAuth.
     * 
     * @param {...any[]} args
     * 
     * @memberOf MoocchatAuth
     */
    constructor(authName: string) {
        this.authName = authName;
    }


    public abstract isValid(): IMoocchatAuthProcessReturn;

    public abstract isAuthenticated(): IMoocchatAuthProcessReturn;

    /**
     * 
     * 
     * @abstract
     * @returns {IMoocchatIdentityInfo}
     * 
     * @memberOf MoocchatAuth
     */
    public abstract getIdentity(): IMoocchatIdentityInfo;

    /**
     * 
     * 
     * @returns {string}
     * 
     * @memberOf MoocchatAuth
     */
    public getAuthName() {
        return this.authName;
    }

    public authenticate(): IMoocchatAuthProcessReturn {
        const validCheckResult = this.isValid();
        if (!validCheckResult.result) {
            return validCheckResult;
        }

        const authResult = this.isValid();
        if (!authResult.result) {
            return authResult;
        }

        return {
            result: true,
            message: ""
        };
    }
}