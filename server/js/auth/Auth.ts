import {IIdentityInfo} from "./IIdentityInfo";
import {IAuthProcessReturn} from "./IAuthProcessReturn";

export abstract class Auth {
    private authName: string;

    /**
     * Creates an instance of Auth.
     * 
     * @param {...any[]} args
     */
    constructor(authName: string) {
        this.authName = authName;
    }


    public abstract isValid(): IAuthProcessReturn;

    public abstract isAuthenticated(): IAuthProcessReturn;

    public abstract getIdentity(): IIdentityInfo;

    public getAuthName() {
        return this.authName;
    }

    public authenticate(): IAuthProcessReturn {
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