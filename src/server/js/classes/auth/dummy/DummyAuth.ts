import {IMoocchatIdentityInfo} from "../../../interfaces/IMoocchatIdentityInfo";

import * as crypto from "crypto";

import {MoocchatAuth} from "../MoocchatAuth";

export class DummyAuth extends MoocchatAuth {
    protected authName = "Dummy";
    private identity: IMoocchatIdentityInfo;

    constructor() {
        super();
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
            identityId: hash,
            name: {
                full: hash,
            },
            authName: this.getAuthName(),
            course: "DummyCourse",
            roles: ["Student"],
        };
    }
}