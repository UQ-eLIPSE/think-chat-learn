import {EventBox} from "../../common/js/EventBox";
import {WebsocketManager} from "./WebsocketManager";

import {WebsocketEvents} from "./WebsocketEvents";
import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../common/interfaces/IWSToServerData";
import {ILTIData} from "../../common/interfaces/ILTIData";

/**
 * MOOCchat
 * Client user class module
 * 
 * Handles user info and logging in.
 */
export class MoocchatUser {
    private ltiData: ILTIData;

    private sharedEventManager: EventBox;

    /**
     * @param {string} username
     */
    constructor(sharedEventManager: EventBox, ltiData: ILTIData) {
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
    public set onLoginSuccess(callback: (data?: IWSToClientData.LoginSuccess) => void) {
        this.sharedEventManager.on(MoocchatUser_Events.LOGIN_SUCCESS, callback);
    }

    /**
     * Setter for login failure callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginFail(callback: (data?: IWSToClientData.LoginFailure | IWSToClientData.LoginExistingUser) => void) {
        this.sharedEventManager.on(MoocchatUser_Events.LOGIN_FAIL, callback);
    }

    /**
     * Clears all callbacks.
     */
    public clearLoginCallbacks() {
        this.clearLoginSuccessCallbacks();
        this.clearLoginFailCallbacks();
    }

    private clearLoginSuccessCallbacks() {
        this.sharedEventManager.off(MoocchatUser_Events.LOGIN_SUCCESS);
    }

    private clearLoginFailCallbacks() {
        this.sharedEventManager.off(MoocchatUser_Events.LOGIN_FAIL);
    }

    /**
     * Executes login.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    public login(socket: WebsocketManager) {
        this.attachLoginReturnHandlers(socket);

        socket.emitData<IWSToServerData.LoginLti>(WebsocketEvents.OUTBOUND.LOGIN_LTI_REQUEST, this.ltiData);
    }

    /**
     * Attaches login return event handlers.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    private attachLoginReturnHandlers(socket: WebsocketManager) {
        socket.once<IWSToClientData.LoginSuccess>(WebsocketEvents.INBOUND.LOGIN_SUCCESS, (data) => {
            this.sharedEventManager.dispatch(MoocchatUser_Events.LOGIN_SUCCESS, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once<IWSToClientData.LoginFailure>(WebsocketEvents.INBOUND.LOGIN_FAILURE, (data) => {
            this.sharedEventManager.dispatch(MoocchatUser_Events.LOGIN_FAIL, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once<IWSToClientData.LoginExistingUser>(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, (data) => {
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
