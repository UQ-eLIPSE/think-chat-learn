import {Conf} from "../Conf";

import {PacSeq} from "./PacSeq";
import {EventBox} from "./EventBox";
import * as IPacSeqSocketPacket from "../interfaces/IPacSeqSocketPacket";

declare type _SocketType = any;

export enum PacSeqSocketMode {
    QUEUE_AND_SEND,
    QUEUE_ONLY
}


// TODO: Fix `SocketType` and `_SocketType` types as they are
// not type-safe ("any")
export class PacSeqSocket<SocketType> {
    private socket: _SocketType;
    private mode: PacSeqSocketMode = PacSeqSocketMode.QUEUE_ONLY;

    private sequencer: PacSeq = new PacSeq();
    private sendTimeoutHandle: number;
    private sendInfo = {
        seq: -1,
        attempts: 0,
    };

    private lastAcknowledged: number = -1;

    private eventManager: EventBox = new EventBox();



    public static Copy<T>(fromSocket: PacSeqSocket<T>, toSocket: PacSeqSocket<T>) {
        const fromSocketState = fromSocket.mode;
        const toSocketState = toSocket.mode;

        // Pause both
        fromSocket.pause();
        toSocket.pause();

        // Copy over
        toSocket.sequencer = fromSocket.sequencer;
        toSocket.sendInfo = fromSocket.sendInfo;
        toSocket.lastAcknowledged = fromSocket.lastAcknowledged;
        toSocket.eventManager = fromSocket.eventManager;

        // Return to resume
        if (fromSocketState === PacSeqSocketMode.QUEUE_AND_SEND) {
            fromSocket.resume();
        }

        if (toSocketState === PacSeqSocketMode.QUEUE_AND_SEND) {
            toSocket.resume();
        }
    }

    public static Destroy<T>(psSocket: PacSeqSocket<T>) {
        console.log(`PacSeqSocket${psSocket.id} DESTROYING`);

        psSocket.pause();

        psSocket.socket.removeAllListeners();

        psSocket.mode = undefined;
        psSocket.sequencer = undefined;
        psSocket.sendInfo = undefined;
        psSocket.lastAcknowledged = undefined;
        psSocket.eventManager = undefined;

    }



    constructor(socket: SocketType) {
        this.socket = socket;

        // Run #onConnect() now if already connected
        if (this.socket.connected) {
            this.onConnect();
        }

        this.socket.on(IPacSeqSocketPacket.EventName.ACK, this.onACK.bind(this));
        this.socket.on(IPacSeqSocketPacket.EventName.DAT, this.onDAT.bind(this));

        this.socket.on("connect", this.onConnect.bind(this));
        // this.socket.on("reconnect", () => {});
        this.socket.on("disconnect", this.onDisconnect.bind(this));
    }

    public emit(event: string, ...args: any[]) {
        this.resume();
        this.sendDAT(event, args[0]);
    }

    public on(event: string, fn: (data?: any) => any) {
        this.eventManager.on(event, fn, false);
    }

    public once(event: string, fn: (data?: any) => any) {
        // Take reference now so that the #off() method call references the correct event manager
        // in the case where the event manager is transferred
        const eventManager = this.eventManager;

        eventManager.on(event, (data?: any) => {
            // Execute callback then remove the handler immediately
            fn(data);
            eventManager.off(event, fn);
        });
    }

    public off(event: string, fn?: (data?: any) => any) {
        this.eventManager.off(event, fn);
    }

    public disconnect(close?: boolean) {
        return this.socket.disconnect(close);
    }

    public get id() {
        return this.socket.id;
    }

    public getSocket() {
        return this.socket;
    }





    private onConnect() {
        if (this.mode !== PacSeqSocketMode.QUEUE_AND_SEND) {
            console.log(`PacSeqSocket${this.id} STARTING/RESUMING`);

            // Queue and send
            this.mode = PacSeqSocketMode.QUEUE_AND_SEND;
            this.sendQueuedDAT();
        }
    }

    private onDisconnect() {
        if (this.mode !== PacSeqSocketMode.QUEUE_ONLY) {
            console.log(`PacSeqSocket${this.id} PAUSING`);

            // Stop sending, queue instead
            this.mode = PacSeqSocketMode.QUEUE_ONLY;
            clearTimeout(this.sendTimeoutHandle);
        }
    }

    public resume() {
        this.onConnect();
    }

    public pause() {
        this.onDisconnect();
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

        this.socket.emit(IPacSeqSocketPacket.EventName.ACK, ackPacket);
    }

    private sendDAT(event: string, data: any) {
        const datPacket: IPacSeqSocketPacket.Packet.DAT = {
            seq: -1,        // This is filled in later below
            event: event,
            data: data
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

    private sendQueuedDAT() {
        clearTimeout(this.sendTimeoutHandle);

        const datPacket: IPacSeqSocketPacket.Packet.DAT = this.sequencer.next();

        if (datPacket && this.mode === PacSeqSocketMode.QUEUE_AND_SEND) {
            this.socket.emit(IPacSeqSocketPacket.EventName.DAT, datPacket);

            // TODO: Resolve `any` type to get around possible NodeJS.Timer type conflict
            const timerHandle: any = setTimeout(() => {
                this.sendQueuedDAT();
            }, Conf.PacSeqSocket.ResendIntervalMS);

            this.sendTimeoutHandle = timerHandle;
        }
    }
}
