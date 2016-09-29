import {IMoocchatIdentityInfo} from "../IMoocchatIdentityInfo";

import * as crypto from "crypto";

import {MoocchatAuth} from "../MoocchatAuth";

export class DummyAuth extends MoocchatAuth {
    private identity: IMoocchatIdentityInfo;

    constructor() {
        super("Dummy");
        this.setRandomIdentity();
    }

    public isValid() {
        return {
            result: true,
            message: ""
        };
    }

    public isAuthenticated() {
        return {
            result: true,
            message: ""
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