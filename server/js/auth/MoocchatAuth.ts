import {IMoocchatIdentityInfo} from "./IMoocchatIdentityInfo";
import {IMoocchatAuthProcessReturn} from "./IMoocchatAuthProcessReturn";

export abstract class MoocchatAuth {
    private authName: string;

    /**
     * Creates an instance of MoocchatAuth.
     * 
     * @param {...any[]} args
     */
    constructor(authName: string) {
        this.authName = authName;
    }


    public abstract isValid(): IMoocchatAuthProcessReturn;

    public abstract isAuthenticated(): IMoocchatAuthProcessReturn;

    public abstract getIdentity(): IMoocchatIdentityInfo;

    public getAuthName() {
        return this.authName;
    }

    public authenticate(): IMoocchatAuthProcessReturn {
        const validCheckResult = this.isValid();
        if (!validCheckResult.success) {
            return validCheckResult;
        }

        const authResult = this.isAuthenticated();
        if (!authResult.success) {
            return authResult;
        }

        return {
            success: true
        };
    }
}