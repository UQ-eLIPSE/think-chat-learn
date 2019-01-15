import { Socket } from "socket.io-client";
import { PacSeqSocket } from "./PacSeqSocket";

export class PacSeqSocket_Client extends PacSeqSocket<SocketIOClient.Socket> {
    protected enableInternalEventDispatch: boolean = true;
}
