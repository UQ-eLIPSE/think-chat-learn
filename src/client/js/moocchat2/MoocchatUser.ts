import * as socket from "socket.io-client";

import {WebsocketManager, WebsocketEvents} from "./Websockets";
import {IEventData_LoginSuccess, IEventData_LoginFailure, IEventData_LoginExistingUser} from "./IEventData";

/*
 * MOOCchat
 * Client user class module
 * 
 * 
 */

export class MoocchatUser {
    private _username: string;

    private loginSuccessCallback: Function = () => {};
    private loginFailCallback: Function = () => {};

    constructor(username: string) {
        this._username = username;
    }

    public get username() {
        return this._username;
    }

    // TODO: Needs late binding support
    // TODO: Fire late bound callbacks after event occurrence

    public set onLoginSuccess(callback: (data?: IEventData_LoginSuccess) => void) {
        this.loginSuccessCallback = callback;
    }

    public set onLoginFail(callback: (data?: IEventData_LoginFailure | IEventData_LoginExistingUser) => void) {
        this.loginFailCallback = callback;
    }

    public login(socket: WebsocketManager) {
        socket.emit(WebsocketEvents.OUTBOUND.LOGIN_REQUEST, {
            username: this.username,
            password: "ischool",
            turkHitId: undefined,
            browserInformation: navigator.userAgent
        });

        socket.once(WebsocketEvents.INBOUND.LOGIN_SUCCESS, this.loginSuccessCallback);
        socket.once(WebsocketEvents.INBOUND.LOGIN_FAILURE, this.loginFailCallback);
        socket.once(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, this.loginFailCallback);

        // TODO: Kill event handlers once login completed?
    }
}
