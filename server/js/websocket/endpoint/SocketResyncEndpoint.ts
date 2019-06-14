import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import { SocketSession } from "../SocketSession";
import { QuizSessionService } from "../../../services/QuizSessionService";

// Handles the resyncing of sockets. E.g. a disconnect -> reconnect
export class SocketResyncEndpoint extends WSEndpoint {
    private static async HandleSessionSocketResync(socket: PacSeqSocket_Server, data: IWSToServerData.SessionSocketResync, quizSessionService:
            QuizSessionService) {

        // TODO replace with userSessionService
        const session = await quizSessionService.findOne(data.quizSessionId);

        if (!session) {
            return console.error("Attempted session socket resync with invalid session ID = " + data.quizSessionId);
        }

        const socketSession = SocketSession.GetAutoCreate(data.quizSessionId);

        // Before we set the socket, we need to check the previous socket and terminate it nicely
        if (socketSession.getSocket() && socketSession.getSocket()!.getSocket().conn.readyState === "open") {
            socketSession.getSocket()!.emit("terminateBrowser");
        }

        socketSession.setSocket(socket);
        SocketSession.PutSocketIdWithQuizSession(socket.id, data.quizSessionId);
    }



    constructor(socket: PacSeqSocket_Server, quizSessionService: QuizSessionService) {
        super(socket);
        this.quizSessionService = quizSessionService;
    }

    private quizSessionService: QuizSessionService;

    public get onSessionSocketResync() {
        return (data: IWSToServerData.SessionSocketResync) => {
            SocketResyncEndpoint.HandleSessionSocketResync(this.getSocket(), data, this.quizSessionService);
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