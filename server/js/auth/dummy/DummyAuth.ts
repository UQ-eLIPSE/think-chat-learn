import {ITCLIdentityInfo} from "../ITCLIdentityInfo";

import * as crypto from "crypto";

import {TCLAuth} from "../TCLAuth";

export class DummyAuth extends TCLAuth {
    private identity: ITCLIdentityInfo;

    constructor() {
        super("Dummy");
        this.setRandomIdentity();
    }

    public isValid() {
        return {
            success: true
        };
    }

    public isAuthenticated() {
        return {
            success: true
        };
    }

    public getIdentity() {
        return this.identity;
    }

    private setRandomIdentity() {
        const hash = crypto.randomBytes(20).toString("hex");

        this.identity = {
            _authName: this.getAuthName(),
            
            identityId: hash,
            name: {
                full: hash,
            },
            course: "DummyCourse",
            roles: ["Student", "Instructor"],
        };
    }
}