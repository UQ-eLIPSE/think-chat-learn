import {IMoocchatIdentityInfo} from "../IMoocchatIdentityInfo";

import crypto from "crypto";

import {MoocchatAuth} from "../MoocchatAuth";

export class DummyAuth extends MoocchatAuth {
    private identity: IMoocchatIdentityInfo;

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