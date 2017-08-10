import {PacSeqSocket_Server} from "../../../common/js/PacSeqSocket_Server";

export abstract class WSEndpoint {
    public static RegisterSocketWithEndpointEventHandler(socket: PacSeqSocket_Server, endpointInstance: WSEndpoint, name: string) {
        socket.on(name, endpointInstance.returnEndpointEventHandler(name));
    } 

    public static RegisterSocketWithEndpointEventHandlers(socket: PacSeqSocket_Server, endpointInstance: WSEndpoint, names: string[]) {
        names.forEach((name) => {
            WSEndpoint.RegisterSocketWithEndpointEventHandler(socket, endpointInstance, name);
        });
    }



    private socket: PacSeqSocket_Server;

    constructor(socket: PacSeqSocket_Server) {
        this.setSocket(socket);
    }

    private setSocket(socket: PacSeqSocket_Server) {
        this.socket = socket;
    }

    protected getSocket() {
        return this.socket;
    }

    public abstract returnEndpointEventHandler(name: string): WSEndpointFunction;

    public abstract registerAllEndpointSocketEvents(): void;
}

export type WSEndpointFunction = (data: any) => void;