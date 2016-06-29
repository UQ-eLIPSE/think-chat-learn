import * as socket from "socket.io-client";

import {EventBox, EventBoxCallback} from "./EventBox";
import {WebsocketManager, WebsocketEvents} from "./Websockets";
import {IEventData_LoginSuccess, IEventData_LoginFailure, IEventData_LoginExistingUser} from "./IEventData";

const MoocchatUser_InternalLoginEvents = {
    SUCCESS: "MCUSER_LOGIN_SUCCESS",
    FAIL: "MCUSER_LOGIN_FAIL"
}

/**
 * MOOCchat
 * Client user class module
 * 
 * Handles user info and logging in.
 */
export class MoocchatUser {
    private _username: string;

    private eventBox: EventBox = new EventBox();

    /**
     * @param {string} username
     */
    constructor(username: string) {
        this._username = username;
    }

    public get username() {
        return this._username;
    }

    /**
     * Setter for login success callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginSuccess(callback: (data?: IEventData_LoginSuccess) => void) {
        this.eventBox.on(MoocchatUser_InternalLoginEvents.SUCCESS, callback);
    }

    /**
     * Setter for login failure callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginFail(callback: (data?: IEventData_LoginFailure | IEventData_LoginExistingUser) => void) {
        this.eventBox.on(MoocchatUser_InternalLoginEvents.FAIL, callback);
    }

    /**
     * Clears all callbacks.
     */
    public clearLoginCallbacks() {
        this.eventBox.destroy();
    }

    /**
     * Executes login.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    public login(socket: WebsocketManager) {
        this.attachLoginReturnHandlers(socket);

        socket.emit(WebsocketEvents.OUTBOUND.LOGIN_REQUEST, {
            username: this.username,
            password: "ischool",    // TODO: Password is fixed
            turkHitId: undefined,
            browserInformation: navigator.userAgent
        });
    }

    /**
     * Attaches login return event handlers.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    private attachLoginReturnHandlers(socket: WebsocketManager) {
        socket.once(WebsocketEvents.INBOUND.LOGIN_SUCCESS, (data: IEventData_LoginSuccess) => {
            this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.SUCCESS, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once(WebsocketEvents.INBOUND.LOGIN_FAILURE, (data: IEventData_LoginFailure) => {
            this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.FAIL, data);
            this.detachLoginReturnHandlers(socket);
        });
        socket.once(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, (data: IEventData_LoginExistingUser) => {
            this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.FAIL, data);
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
