import * as socket from "socket.io-client";

/**
 * MOOCchat
 * Websocket management class module
 * 
 * Acts as thin layer over Socket.IO object; methods act approximately the same way.
 */
export class WebsocketManager {
    protected socket: SocketIOClient.Socket;

    public open() {
        this.socket = socket.connect({
            path: "/socket.io",
            reconnection: false,            // Don't reconnect
            transports: ["websocket"]
        });
    }

    public close() {
        return this.socket.close();
    }

    public emit(event: string, ...args: any[]) {
        return this.socket.emit(event, ...args);
    }

    public emitData<IData>(event: string, data: IData) {
        return this.emit(event, data);
    }

    public on<IData>(event: string, fn: (data: IData) => void) {
        return this.socket.on(event, fn);
    }

    public off(event: string, fn?: Function) {
        return this.socket.off(event, fn);
    }

    public once<IData>(event: string, fn: (data: IData) => void) {
        return this.socket.once(event, fn);
    }

    protected getListeners(event: string) {
        return this.socket.listeners(event);
    }

    protected get connected() {
        return this.socket.connected;
    }
}