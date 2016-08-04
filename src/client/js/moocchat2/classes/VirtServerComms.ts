import {conf} from "../conf";

import {WebsocketManager} from "./WebsocketManager";
import {VirtServer} from "./VirtServer";

/**
 * MOOCchat
 * Virtualised server communications module
 * 
 * Provides layer that switches between real and virtual server communications in event of failure
 */
export class VirtServerComms extends WebsocketManager {
    private virtServer: VirtServer;
    private terminated: boolean = false;
    private virtServerSwitchOver: boolean = false;

    constructor() {
        super();
    }

    private get mode() {
        return this.socket.connected ? ServerSocketState.REAL_WEBSOCKET_CONNECTION : ServerSocketState.VIRTUAL_WEBSOCKET_CONNECTION;
    }

    public open() {
        const super_openResult = super.open();

        // NOTE: This event is *NOT* generated by socket.io automatically - it's actually generated by websockets.js in the server!
        this.on("connected", () => {
            // Only enable virt server after we connect for the first time otherwise we may end up with virt server being utilised first
            this.virtServer = new VirtServer();
        });


        this.on("terminated", () => {
            alert("You or someone has requested a full termination of all sessions associated with this username.");
            this.terminated = true;
        });

        return super_openResult;
    }

    public emit(event: string, ...args: any[]) {
        if (this.virtServer) {
            // If disconnected, pass through straight to virtual server
            if (this.mode === ServerSocketState.VIRTUAL_WEBSOCKET_CONNECTION) {
                this.sendToVirtServer(event, args[0]);
                return;
            }

            this.setupVirtServerAutoSwitch_Emit(event, ...args);
        }

        // (Try to) send to server as normal
        return super.emit(event, ...args);
    }

    private setupVirtServerAutoSwitch_Emit(event: string, ...args: any[]) {
        // Set up timeouts that catch whether the server has responded (where known)
        // and switch to virtualised server fallback if no response
        const expectedResponseData = this.virtServer.expectedInboundEventResponseData(event);

        let timeoutHandle: number;

        const clearVirtServerTimeout = () => {
            this.off("disconnect", virtServerSwitch);
            clearTimeout(timeoutHandle);
        }

        const virtServerSwitch = (reason: string) => {
            this.virtServerSwitchOver = true;

            clearVirtServerTimeout();

            // Switchover must close actual websocket connection
            this.close();
            console.log("Switched over to virtual server");

            // Send to server
            this.sendToVirtServer("_VIRTSERVER", {
                timestamp: new Date().toISOString(),
                switchReason: reason
            });

            this.sendToVirtServer(event, args[0]);
        }



        // If there are expected responses
        if (expectedResponseData.length) {
            let indefiniteEventExpected = false;

            expectedResponseData.forEach((inboundEventExpected) => {
                this.once(inboundEventExpected.event, clearVirtServerTimeout);

                if (inboundEventExpected.indefiniteTimeout) {
                    indefiniteEventExpected = true;
                }
            });

            // If there are other events that cause a switch over (disconnect) then this emit also needs to switch
            this.once("disconnect", () => {
                // If disconnect came from virtServerSwitch(), then just send the event as is 
                if (this.virtServerSwitchOver) {
                    this.sendToVirtServer(event, args[0]);
                } else {
                    virtServerSwitch("Client received disconnect event");
                }
            });

            // Don't set timeout for indefinitely long responses
            if (!indefiniteEventExpected) {
                const timeoutMs = conf.virtServer.maxRealServerTimeoutMs;

                timeoutHandle = setTimeout(() => {
                    virtServerSwitch(`Client did not receive server response within ${timeoutMs}ms`);
                }, timeoutMs);
            }
        }
    }

    private sendToVirtServer<IData>(event: string, data: IData) {
        if (this.terminated) {
            return;
        }

        // Pretend websocket is being responded to
        const virtServerResponse = this.virtServer.sendToServer(event, data);

        if (typeof virtServerResponse === "undefined") {
            return;
        }

        const listeners = this.getListeners(virtServerResponse.event);

        // Trigger event
        listeners.forEach((listener) => {
            // When executing the event handlers, they must be scoped to the Socket.IO object
            listener.bind(this.socket)(virtServerResponse.data);
        });
    }

    private isThereDataToSend() {
        return this.virtServer.getStore().length > 0;
    }

    public syncWithRealServer(sessionId: string) {
        const virtServer = this.virtServer;

        if (!virtServer) {
            return;
        }

        if (!this.isThereDataToSend()) {
            return;
        }

        return virtServer.syncWithRealServer(sessionId);
    }
}

export enum ServerSocketState {
    REAL_WEBSOCKET_CONNECTION,
    VIRTUAL_WEBSOCKET_CONNECTION
}