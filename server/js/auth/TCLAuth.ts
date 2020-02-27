import {ITCLIdentityInfo} from "./ITCLIdentityInfo";
import {ITCLAuthProcessReturn} from "./ITCLAuthProcessReturn";

export abstract class TCLAuth {
    private authName: string;

    /**
     * Creates an instance of TCLAuth.
     * 
     * @param {...any[]} args
     */
    constructor(authName: string) {
        this.authName = authName;
    }


    public abstract isValid(): ITCLAuthProcessReturn;

    public abstract isAuthenticated(): ITCLAuthProcessReturn;

    public abstract getIdentity(): ITCLIdentityInfo;

    public getAuthName() {
        return this.authName;
    }

    public authenticate(): ITCLAuthProcessReturn {
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