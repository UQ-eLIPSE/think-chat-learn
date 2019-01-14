import * as SocketIO from "socket.io";
import {PacSeqSocket} from "./PacSeqSocket";

export class PacSeqSocket_Server extends PacSeqSocket<SocketIO.Socket> {
    // Allows a socket to join a room/channel (socket.io)
    // Return value is for chaining
    public join(id: string, fn?: (data?: any) => any): PacSeqSocket_Server {
        return new PacSeqSocket_Server(this.nativeSocket.join(id, fn));
    }
}