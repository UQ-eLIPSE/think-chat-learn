import * as socket from "socket.io-client";

/**
 * MOOCchat
 * Websocket management class module
 * 
 * Acts as thin layer over Socket.IO object
 */
export class WebsocketManager {
    private socket: SocketIOClient.Socket;
    private silentClose: boolean = false;

    public open() {
        this.socket = socket.connect({
            path: "/socket.io",
            transports: ["websocket"]
        });

        this.on("error", () => {
            alert("An error occurred with the websocket connection.\n\nA restart of MOOCchat is strongly recommended.");
        });

        this.on("disconnect", () => {
            if (this.silentClose) {
                return;
            }
            
            alert("You or the server has disconnected the websocket connection.\n\nYour MOOCchat session has been terminated and will require restarting.");
        });
    }

    public close(silentClose: boolean = false) {
        this.silentClose = silentClose;
        this.socket.close();
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
}