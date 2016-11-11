import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

// import {MoocchatUserSession} from "../../user/MoocchatUserSession";

export class SocketResyncEndpoint extends WSEndpoint {
    private static HandleSessionSocketResync(socket: PacSeqSocket_Server, data: IWSToServerData.SessionSocketResync) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted session socket resync with invalid session ID = " + data.sessionId);
        }

        // No need to do anything further because the socket resync
        // happens within MoocchatUserSession.GetSession
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