import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";


import { SocketSession } from "../SocketSession";

// DB imports
import { QuizSessionService } from "../../../services/QuizSessionService";

export class UserLoginEndpoint extends WSEndpoint {
    private static NotifyClientOnError(socket: PacSeqSocket_Server, e: Error) {
        socket.emit("loginFailure", (e && e.message) ? e.message : "Unexpected error");
    }

    private static async HandleLogout(socket: PacSeqSocket_Server, data: IWSToServerData.Logout, quizSessionService: QuizSessionService) {

        const session = await quizSessionService.findOne(data.quizSessionId);
        
        if (!session) {
            return console.error("Attempted to logout with invalid session ID = " + data.quizSessionId);
        }

        const sock = SocketSession.Get(data.quizSessionId);

        // Make sure we do not have users mocking/replicating this socket event by checking the socket id itself
        if (sock && sock.getSocket() && sock.getSocket()!.id === socket.id) {
            socket.emitData<IWSToClientData.LogoutSuccess>("logoutSuccess", {
                quizSessionId: data.quizSessionId,
            });

            sock.destroyInstance(data.groupId);
        } else {
            return console.error(`Attempted to logout a user with session ID = ${data.quizSessionId} without a socket`);
        }
    }

    // This officially stores the quiz session for storage purposes. On the front end, its should be when the user selects a start
    // This is avoid superflous requests
    private static async StoreQuizSessionSocket(socket: PacSeqSocket_Server, 
            data: IWSToServerData.StoreSession, quizSessionService: QuizSessionService) {
        // Check if it is a valid session
        const quizSession = await quizSessionService.findOne(data.quizSessionId);

        if (!quizSession || !quizSession._id) {
            console.error(`Could not find quiz session with quiz id ${data.quizSessionId}`);
            throw Error("Invalid quiz session");
        }

        // At this point it is valid, we can then use the store the socket in memory
        const session = SocketSession.GetAutoCreate(quizSession._id);
        session.setSocket(socket);
        socket.emit("StoreSessionAcknowledged");

        // We also store the mapping as well so we can handle disconnnects fast
        SocketSession.PutSocketIdWithQuizSession(socket.id, quizSession._id);

    }

    // Service which points to the quizSession table
    private quizSessionService: QuizSessionService;

    constructor(socket: PacSeqSocket_Server, quizSessionService: QuizSessionService) {
        super(socket);
        this.quizSessionService = quizSessionService;
    }

    public get onLogout() {
        return (data: IWSToServerData.Logout) => {
            UserLoginEndpoint.HandleLogout(this.getSocket(), data, this.quizSessionService)
                .catch(e => console.error(e));
        };
    }

    public get onStoreQuizSessionSocket() {
        return (data: IWSToServerData.StoreSession) => {
            UserLoginEndpoint.StoreQuizSessionSocket(this.getSocket(), data, this.quizSessionService);
        }
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "logout": return this.onLogout;
            case "storeQuizSessionSocket": return this.onStoreQuizSessionSocket;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "logout",
            "storeQuizSessionSocket"
        ]);
    }
}
