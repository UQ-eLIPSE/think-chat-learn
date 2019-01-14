export const EventName = {
    DAT: "PacSeq::DAT",
    ACK: "PacSeq::ACK"
};

export namespace Packet {
    export interface DAT {
        seq: number;
        event: string;
        data: any;
    }

    export interface ACK {
        ack: number;
    }
}