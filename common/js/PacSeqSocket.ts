import { Conf } from "../config/Conf";

import { PacSeq } from "./PacSeq";
import { EventBox } from "./EventBox";
import * as IPacSeqSocketPacket from "../interfaces/IPacSeqSocketPacket";

declare type _SocketType = any;

export enum PacSeqSocketMode {
  QUEUE_AND_SEND,
  QUEUE_ONLY
}

// TODO: Fix `SocketType` and `_SocketType` types as they are
// not type-safe ("any")
export class PacSeqSocket<SocketType> {
  public static Copy<T>(
    fromSocket: PacSeqSocket<T>,
    toSocket: PacSeqSocket<T>
  ) {
    const fromSocketState = fromSocket.mode;
    const toSocketState = toSocket.mode;

    // Pause both
    fromSocket.pause();
    toSocket.pause();

    // Copy over
    toSocket.sequencer = fromSocket.sequencer;
    toSocket.lastAcknowledged = fromSocket.lastAcknowledged;
    toSocket.eventManager = fromSocket.eventManager;

    // Set transferred reference
    fromSocket.transferredTo = toSocket;

    // Return to resume
    if (fromSocketState === PacSeqSocketMode.QUEUE_AND_SEND) {
      fromSocket.resume();
    }

    if (toSocketState === PacSeqSocketMode.QUEUE_AND_SEND) {
      toSocket.resume();
    }
  }

  public static Destroy<T>(psSocket: PacSeqSocket<T>) {
    psSocket.pause();

    psSocket.nativeSocket.removeAllListeners();
    psSocket.disconnect(true);

    // NOTE: ***Do not destroy*** #eventManager as it refers to the same
    // EventBox which was carried over to the new PacSeqSocket obj when .Copy() is run
    // EventBox.Destroy(psSocket.eventManager);

    delete psSocket.mode;
    delete psSocket.sequencer;
    delete psSocket.lastAcknowledged;
    delete psSocket.eventManager;
  }

  /**
   * Gets the latest known socket from which given socket was copied to
   */
  public static GetLatest<T>(psSocket: PacSeqSocket<T>): PacSeqSocket<T> {
    if (psSocket.transferredTo) {
      return PacSeqSocket.GetLatest(psSocket.transferredTo);
    }

    return psSocket;
  }

  protected enableInternalEventDispatch: boolean = false;

  protected nativeSocket: _SocketType;

  /* ===== FOR TESTING PURPOSES ONLY ===== */

  /** Number of times a packet is sent over wire */
  protected numberOfTimesToSendOverWirePerEmit: number = 1;

  /** Number of times a socket message will be emitted (as separate messages) */
  protected numberOfTimesToRepeatEmit: number = 1;

  private mode: PacSeqSocketMode = PacSeqSocketMode.QUEUE_ONLY;

  private sequencer: PacSeq = new PacSeq();
  private sendTimeoutHandle: number = 1000;

  private inboundLogging: boolean = false;
  private outboundLogging: boolean = false;

  private lastAcknowledged: number = -1;

  private eventManager: EventBox = new EventBox();

  /** Holds pointer to new socket from which this socket was copied */
  private transferredTo: PacSeqSocket<SocketType> | undefined = undefined;

  constructor(socket: SocketType) {
    this.nativeSocket = socket;

    // Run #onConnect() now if already connected
    if (this.nativeSocket.connected) {
      this.onConnect();
    }

    this.setupNativeEventsToManager();

    this.nativeSocket.on(
      IPacSeqSocketPacket.EventName.ACK,
      this.onACK.bind(this)
    );
    this.nativeSocket.on(
      IPacSeqSocketPacket.EventName.DAT,
      this.onDAT.bind(this)
    );

    this.nativeSocket.on("connect", this.onConnect.bind(this));
    // this.socket.on("reconnect", () => {});
    this.nativeSocket.on("disconnect", this.onDisconnect.bind(this));
  }

  public emit(event: string, ...args: any[]) {
    this.resume();

    if (this.outboundLogging) {
      const loggedData = [
        `PacSeqSocket/${this.id}`,
        "OUTBOUND",
        "[" + event + "]"
      ];

      if (typeof args[0] !== "undefined") {
        loggedData.push(args[0]);
      }
    }

    for (let i = 0; i < this.numberOfTimesToRepeatEmit; ++i) {
      this.sendDAT(event, args[0]);
    }
  }

  public emitData<T>(event: string, data: T) {
    return this.emit(event, data);
  }

  public on(event: string, fn: (data?: any) => any) {
    const callbacksOfEvent = this.eventManager.getCallbacksFor(event);
    if (!callbacksOfEvent || callbacksOfEvent.length === 0) {
      this.eventManager.on(event, (data?: any) => {
        // This socket session may be transferred; so event handlers don't
        // necessarily have the reference to the new PacSeqSocket at run time.
        const activeSocket = PacSeqSocket.GetLatest(this);

        if (!activeSocket || !activeSocket.inboundLogging) {
          return;
        }

        const loggedData = [
          `PacSeqSocket/${activeSocket.id}`,
          "INBOUND",
          "[" + event + "]"
        ];

        if (typeof data !== "undefined") {
          loggedData.push(data);
        }
      });
    }
    this.eventManager.on(event, fn);
  }

  public once(event: string, fn: (data?: any) => any) {
    // Take reference now so that the #off() method call references the correct event manager
    // in the case where the event manager is transferred
    const eventManager = this.eventManager;

    const wrappedCallback = (data?: any) => {
      // Remove the handler FIRST then run callback;
      // otherwise if `fn` fails to return then we would be
      // left with a dangling callback still attached to the event
      //
      // Also, the callback to be removed is the WRAPPED callback
      // and not the original one - this mirrors the `.on()` below
      eventManager.off(event, wrappedCallback);
      fn(data);
    };

    // Keep track of the original callback
    (wrappedCallback as any)["__originalCallback"] = fn;

    eventManager.on(event, wrappedCallback);
  }

  public off(event: string, fn?: (data?: any) => any) {
    const eventManager = this.eventManager;
    eventManager.off(event, fn);

    // Specific `off` behaviour for wrapped callbacks due to `.once()`
    // putting in wrapped callbacks, not the original callback
    if (fn) {
      const callbacks = this.eventManager.getCallbacksFor(event);

      if (callbacks) {
        // Copy out the list of callbacks for this event, then
        // `.off()` wrapped callbacks which contain the original
        // callback
        const callbackArrayCopy = callbacks.slice();

        callbackArrayCopy.forEach((wrappedCallback) => {
          const originalCallback:
            | Function
            | undefined = (wrappedCallback as any)["__originalCallback"];

          if (originalCallback && originalCallback === fn) {
            eventManager.off(event, wrappedCallback);
          }
        });
      }
    }
  }

  public disconnect(close?: boolean) {
    return this.nativeSocket.disconnect(close);
  }

  public get id() {
    return this.nativeSocket.id;
  }

  public getSocket() {
    return this.nativeSocket;
  }

  public enableInboundLogging() {
    this.inboundLogging = true;
  }

  public disableInboundLogging() {
    this.inboundLogging = false;
  }

  public enableOutboundLogging() {
    this.outboundLogging = true;
  }

  public disableOutboundLogging() {
    this.outboundLogging = false;
  }

  /**
   * Workaround for bug #178
   *
   * INTENDED ONLY FOR CLIENT-SIDE RESYNC EVENTS!
   *
   * Resets the ack counter so that we don't run into issues with out-of-sync counters
   */
  public resetIncomingDataAckCounter() {
    this.lastAcknowledged = -1;
  }

  public resume() {
    this.onConnect();
  }

  public pause() {
    this.onDisconnect();
  }

  public use(fn: (packet: any, next: (err?: any) => void) => void) {
    this.nativeSocket.use(fn);
  }

  private setupNativeEventsToManager() {
    // Both server and client Socket.IO events
    const nativeEvents = [
      "error",

      "connection",

      "connect",
      "connect_error",
      "connect_timeout",
      "connecting",

      "reconnect",
      "reconnect_attempt",
      "reconnect_failed",
      "reconnect_error",
      "reconnecting",

      "disconnect",

      "newListener",
      "removeListener",

      "ping",
      "pong"
    ];

    nativeEvents.forEach((eventName) => {
      this.nativeSocket.on(eventName, (...args: any[]) => {
        this.eventManager.dispatch(eventName, args[0]);
      });
    });
  }

  private onConnect() {
    if (this.mode !== PacSeqSocketMode.QUEUE_AND_SEND) {
      // Queue and send
      this.mode = PacSeqSocketMode.QUEUE_AND_SEND;
      this.sendQueuedDAT();
    }
  }

  private onDisconnect() {
    if (this.mode !== PacSeqSocketMode.QUEUE_ONLY) {
      // Stop sending, queue instead
      this.mode = PacSeqSocketMode.QUEUE_ONLY;
      clearTimeout(this.sendTimeoutHandle);
    }
  }

  private onACK(ackPacket: IPacSeqSocketPacket.Packet.ACK) {
    this.processACK(ackPacket.ack);
  }

  private onDAT(datPacket: IPacSeqSocketPacket.Packet.DAT) {
    const seqAcknowledged = datPacket.seq;

    if (seqAcknowledged > this.lastAcknowledged) {
      this.processDAT(datPacket);
      this.lastAcknowledged = seqAcknowledged;
    }

    // Reply with ACK
    this.sendACK(seqAcknowledged);
  }

  private processACK(ackReceived: number) {
    // Flush queued packets up to and incl. the received ACK number
    this.sequencer.flush(ackReceived);

    if (this.enableInternalEventDispatch) {
      EventBox.GlobalDispatch("PacSeq::InternalEvent::AckReceived", {
        seq: ackReceived
      });
    }

    // Send any queued DATs now
    this.sendQueuedDAT();
  }

  private processDAT(datPacket: IPacSeqSocketPacket.Packet.DAT) {
    this.eventManager.dispatch(datPacket.event, datPacket.data);
  }

  private sendACK(seqAcknowledged: number) {
    const ackPacket: IPacSeqSocketPacket.Packet.ACK = {
      ack: seqAcknowledged
    };

    for (let i = 0; i < this.numberOfTimesToSendOverWirePerEmit; ++i) {
      this.nativeSocket.emit(IPacSeqSocketPacket.EventName.ACK, ackPacket);
    }
  }

  private sendDAT(event: string, data: any) {
    const datPacket: IPacSeqSocketPacket.Packet.DAT = {
      seq: -1, // This is filled in later below
      event,
      data
    };

    // We can only know the sequence number
    // AFTER we insert the packet data in the sequencer
    const seq = this.sequencer.queue(datPacket);

    // Fill in the sequence number back in to the object
    datPacket.seq = seq;

    // If in send mode, attempt send now
    if (this.mode === PacSeqSocketMode.QUEUE_AND_SEND) {
      this.sendQueuedDAT();
    }
  }

  private sendQueuedDAT(attempt: number = 1) {
    clearTimeout(this.sendTimeoutHandle);

    if (!this.sequencer) {
      // Can't do anything if no sequencer
      return;
    }

    const datPacket: IPacSeqSocketPacket.Packet.DAT = this.sequencer.next();

    if (datPacket && attempt > 500) {
      return;
    }

    if (datPacket && this.mode === PacSeqSocketMode.QUEUE_AND_SEND) {
      if (this.enableInternalEventDispatch) {
        EventBox.GlobalDispatch("PacSeq::InternalEvent::EmitStart", {
          seq: datPacket.seq,
          attempt
        });
      }

      for (let i = 0; i < this.numberOfTimesToSendOverWirePerEmit; ++i) {
        this.nativeSocket.emit(IPacSeqSocketPacket.EventName.DAT, datPacket);
      }

      // TODO: Resolve `any` type to get around possible NodeJS.Timer type conflict
      const timerHandle: any = setTimeout(() => {
        this.sendQueuedDAT(attempt + 1);
      }, Conf.pacSeqSocket.resendIntervalMs);

      this.sendTimeoutHandle = timerHandle;
    }
  }
}
