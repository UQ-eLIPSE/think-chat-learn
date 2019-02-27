import * as socket from "socket.io-client";
import { PacSeqSocket_Client } from "../../common/js/PacSeqSocket_Client";

import { Conf } from "../config/Conf";

/**
 * MOOCchat
 * Websocket management class module
 *
 * Acts as thin layer over Socket.IO object; methods act approximately the same way.
 */
export class WebsocketManager {
  protected socketProxy: PacSeqSocket_Client;
  protected setReconnectFunctions: (() => void) | null = null;

  // Note that the constructor is essentially calling open although TS wants the socket to expliclty be instantiated.
  constructor(reconnectFunction?: (data?: {}) => void) {
    this.socketProxy = new PacSeqSocket_Client(
      socket.connect("//" + Conf.server.url, {
        path: "/socket.io",

        // Permit infinite reconnects
        reconnection: true,
        reconnectionAttempts: Conf.websockets.reconnectionAmount,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 2000,

        transports: ["websocket"]
      })
    );

    this.on("terminated", () => {
      alert(
        "You or someone has requested a full termination of all sessions associated with this username."
      );
    });

    // As per #178, we need to reset the ack counter so that the new sockets are in sync
    this.on("connect", () => {
      this.socketProxy.resetIncomingDataAckCounter();

      if (reconnectFunction) {
        reconnectFunction();
      }
    });

    this.on("err", (data: { reason: string }) => {
      // For now make it an alert message
      alert(data.reason);
    });
  }

  public open() {
    this.socketProxy = new PacSeqSocket_Client(
      socket.connect("//" + Conf.server.url, {
        path: "/socket.io",

        // Permit infinite reconnects
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 2000,

        transports: ["websocket"]
      })
    );

    this.on("terminated", () => {
      alert(
        "You or someone has requested a full termination of all sessions associated with this username."
      );
    });
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

  public restart() {
    const sock = this.socketProxy.getSocket();

    sock.disconnect();

    setTimeout(() => {
      sock.connect();
    }, 1000);
  }

  /**
   * Workaround for bug #178
   *
   * INTENDED ONLY FOR CLIENT-SIDE RESYNC EVENTS!
   *
   * Resets the ack counter so that we don't run into issues with out-of-sync counters
   */
  public resetIncomingDataAckCounter() {
    return this.socketProxy.resetIncomingDataAckCounter();
  }

  // TODO: Fix type
  protected getListeners(event: string) {
    return (this.socketProxy.getSocket() as SocketIOClient.Socket).listeners(
      event
    );
  }

  protected get connected() {
    return this.socketProxy.getSocket().connected;
  }
}
