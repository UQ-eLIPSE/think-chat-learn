import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import { UserSession } from "../../user/UserSession";

import { SocketSession } from "../SocketSession";

// Handles the resyncing of sockets. E.g. a disconnect -> reconnect
export class SocketResyncEndpoint extends WSEndpoint {
    private static HandleSessionSocketResync(socket: PacSeqSocket_Server, data: IWSToServerData.SessionSocketResync) {

        // TODO replace with userSessionService
        const session = UserSession.Get(data.quizSessionId);

        if (!session) {
            return console.error("Attempted session socket resync with invalid session ID = " + data.quizSessionId);
        }

        const socketSession = SocketSession.GetAutoCreate(data.quizSessionId);
        
        socketSession.setSocket(socket);
    }



    constructor(socket: PacSeqSocket_Server) {
        super(socket);
    }

    public get onSessionSocketResync() {
        return (data: IWSToServerData.SessionSocketResync) => {
            SocketResyncEndpoint.HandleSessionSocketResync(this.getSocket(), data);
        };
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "sessionSocketResync": return this.onSessionSocketResync;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "sessionSocketResync",
        ]);
    }
}