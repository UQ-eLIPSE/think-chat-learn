import * as socket from "socket.io-client";

import {EventBox, EventBoxCallback} from "./EventBox";
import {WebsocketManager, WebsocketEvents} from "./Websockets";
import {IEventData_LoginSuccess, IEventData_LoginFailure, IEventData_LoginExistingUser} from "./IEventData";
import {ILTIBasicLaunchData} from "./ILTIBasicLaunchData";

export const MoocchatUser_Events = {
    LOGIN_SUCCESS: "MCUSER_LOGIN_SUCCESS",
    LOGIN_FAIL: "MCUSER_LOGIN_FAIL"
}

export type IMoocchatUser_LoginSuccess = IEventData_LoginSuccess;

/**
 * MOOCchat
 * Client user class module
 * 
 * Handles user info and logging in.
 */
export class MoocchatUser {
    private _username: string;

    private ltiData: ILTIBasicLaunchData;

    private eventBox: EventBox;

    /**
     * @param {string} username
     */
    constructor(eventBox: EventBox, ltiData: ILTIBasicLaunchData) {
        this.eventBox = eventBox;
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
    public set onLoginSuccess(callback: (data?: IEventData_LoginSuccess) => void) {
        this.eventBox.on(MoocchatUser_Events.LOGIN_SUCCESS, callback);
    }

    /**
     * Setter for login failure callbacks.
     * 
     * @param {Function} callback
     */
    public set onLoginFail(callback: (data?: IEventData_LoginFailure | IEventData_LoginExistingUser) => void) {
        this.eventBox.on(MoocchatUser_Events.LOGIN_FAIL, callback);
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

        socket.emit(WebsocketEvents.OUTBOUND.LOGIN_LTI_REQUEST, this.ltiData);
    }

    /**
     * Attaches login return event handlers.
     * 
     * @param {WebsocketManager} socket Websocket to communicate over
     */
    private attachLoginReturnHandlers(socket: WebsocketManager) {
        socket.once(WebsocketEvents.INBOUND.LOGIN_SUCCESS, (data: IEventData_LoginSuccess) => {
            this.eventBox.dispatch(MoocchatUser_Events.LOGIN_SUCCESS, data);
            this.detachLoginReturnHandlers(socket);
        });

        socket.once(WebsocketEvents.INBOUND.LOGIN_FAILURE, (data: IEventData_LoginFailure) => {
            this.eventBox.dispatch(MoocchatUser_Events.LOGIN_FAIL, data);
            this.detachLoginReturnHandlers(socket);
        });
        socket.once(WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, (data: IEventData_LoginExistingUser) => {
            this.eventBox.dispatch(MoocchatUser_Events.LOGIN_FAIL, data);
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
