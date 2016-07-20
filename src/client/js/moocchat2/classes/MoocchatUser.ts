import * as socket from "socket.io-client";

import {EventBox, EventBox_Callback} from "./EventBox";
import {WebsocketManager} from "./WebsocketManager";

import {WebsocketEvents} from "./WebsocketEvents";
import * as IInboundData from "./IInboundData";
import * as IOutboundData from "./IOutboundData";
import {ILTIBasicLaunchData} from "./ILTIBasicLaunchData";

/**
 * MOOCchat
 * Client user class module
 * 
 * Handles user info and logging in.
 */
export class MoocchatUser {
    private _username: string;

    private ltiData: ILTIBasicLaunchData;

    private sharedEventManager: EventBox;

    /**
     * @param {string} username
     */
    constructor(sharedEventManager: EventBox, ltiData: ILTIBasicLaunchData) {
        this.sharedEventManager = sharedEventManager;
        this.ltiData = ltiData;
    }

    public get username() {
        return this.ltiData.user_id;
    }

    /**
     * Setter for login success callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginSuccess(callback: (data?: IInboundData.LoginSuccess) => void) {
        this.sharedEventManager.on(MoocchatUser_Events.LOGIN_SUCCESS, callback);
    }

    /**
     * Setter for login failure callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginFail(callback: (data?: IInboundData.LoginFailure | IInboundData.LoginExistingUser) => void) {
        this.sharedEventManager.on(MoocchatUser_Events.LOGIN_FAIL, callback);
    }

    /**
     * Clears all callbacks.
     */
    public clearLoginCallbacks() {
        this.sharedEventManager.destroy();
    }

    /**
     * Executes login.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    public login(socket: WebsocketManager) {
        this.attachLoginReturnHandlers(socket);

        socket.emitData<IOutboundData.LoginLti>(WebsocketEvents.OUTBOUND.LOGIN_LTI_REQUEST, this.ltiData);
    }

    /**
     * Attaches login return event handlers.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    private attachLoginReturnHandlers(socket: WebsocketManager) {
        socket.once<IInboundData.LoginSuccess>(WebsocketEvents.INBOUND.LOGIN_SUCCESS, (data) => {
            this.sharedEventManager.dispatch(MoocchatUser_Events.LOGIN_SUCCESS, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once<IInboundData.LoginFailure>(WebsocketEvents.INBOUND.LOGIN_FAILURE, (data) => {
            this.sharedEventManager.dispatch(MoocchatUser_Events.LOGIN_FAIL, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once<IInboundData.LoginExistingUser>(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, (data) => {
            this.sharedEventManager.dispatch(MoocchatUser_Events.LOGIN_FAIL, data);
            this.detachLoginReturnHandlers(socket);
        });
    }

    /**
     * Detaches login return event handlers.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    private detachLoginReturnHandlers(socket: WebsocketManager) {
        socket.off(WebsocketEvents.INBOUND.LOGIN_SUCCESS);
        socket.off(WebsocketEvents.INBOUND.LOGIN_FAILURE);
        socket.off(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS);
    }
}

export const MoocchatUser_Events = {
    LOGIN_SUCCESS: "MCUSER_LOGIN_SUCCESS",
    LOGIN_FAIL: "MCUSER_LOGIN_FAIL"
}
