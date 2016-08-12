import * as socket from "socket.io-client";

import {PacSeqSocket_Client} from "../../../common/js/classes/PacSeqSocket_Client";

/**
 * MOOCchat
 * Websocket management class module
 * 
 * Acts as thin layer over Socket.IO object; methods act approximately the same way.
 */
export class WebsocketManager {
    protected socketProxy: PacSeqSocket_Client;

    public open() {
        this.socketProxy = new PacSeqSocket_Client(
            socket.connect({
                path: "/socket.io",

                // Permit infinite reconnects
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1500,
                reconnectionDelayMax: 5000,

                transports: ["websocket"]
            })
        );
    }

    public close() {
        this.socketProxy.pause();
        return this.socketProxy.getSocket().close();
    }

    public emit(event: string, ...args: any[]) {
        return this.socketProxy.emit(event, ...args);
    }

    public emitData<IData>(event: string, data: IData) {
        return this.emit(event, data);
    }

    public on<IData>(event: string, fn: (data: IData) => void) {
        return this.socketProxy.on(event, fn);
    }

    public off(event: string, fn?: (data?: any) => any) {
        return this.socketProxy.off(event, fn);
    }

    public once<IData>(event: string, fn: (data?: IData) => void) {
        return this.socketProxy.once(event, fn);
    }

    // TODO: Fix type
    protected getListeners(event: string) {
        return (<SocketIOClient.Socket>this.socketProxy.getSocket()).listeners(event);
    }

    protected get connected() {
        return this.socketProxy.getSocket().connected;
    }
}