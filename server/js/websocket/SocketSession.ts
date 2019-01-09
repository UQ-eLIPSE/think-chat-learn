import { KVStore } from "../../../common/js/KVStore";

import { PacSeqSocket_Server } from "../../../common/js/PacSeqSocket_Server";

// Refers to...
import { UserSession } from "../user/UserSession";

// A socket session is created when a user decides to send a join request
// which is located in the chatEndPoint. The reason for this is because
// the socket is only created/used for chatting rather than for submitting
// answers which is done via HTTP. We store the QuizSessionId because this
// would be marked as an attempt rather than any arbitrary session (userSession)

// Additionally we also store the groups associated here as well
export class SocketSession {
    private static readonly Store = new KVStore<SocketSession>();
    private static readonly GroupStore = new KVStore<SocketSession[]>();

    private /*readonly*/ quizSessionId: string;
    private /*readonly*/ sockets: PacSeqSocket_Server[] = [];
    private isTyping: boolean = false;

    public static Get(quizSessionId: string) {
        return SocketSession.Store.get(quizSessionId);
    }

    // Similar to a single get except it is in a group
    public static GetAutoCreateGroup(groupId: string) {
        const socketArray = SocketSession.GroupStore.get(groupId);

        if (socketArray) {
            return socketArray;
        }

        return SocketSession.CreateGroup(groupId);
    }

    public static GetAutoCreate(quizSession: string) {
        const socketSession = SocketSession.Get(quizSession);

        if (socketSession) {
            return socketSession;
        }

        return SocketSession.Create(quizSession);
    }

    // Places a socket into a group assuming the socket is in the store already
    public static PutInGroup(groupId: string, quizSession: string) {
        const socket = SocketSession.Store.get(quizSession);
        const socketArray = SocketSession.GroupStore.get(groupId);
        console.log("PUTTING IN GROUP");
        if (socket && socketArray) {
            if (socketArray.findIndex((element) => element === socket) === -1) {
                socketArray.push(socket);
            }
            console.error(`Attempted to add duplicate socket in array GroupId: ${groupId}, SessionId: ${quizSession}`);
        } else {
            console.error(`Invalid socket with session id ${quizSession}`);
        }
    }

    public static Create(quizSession: string) {
        return new SocketSession(quizSession);
    }

    // Creates a group which is default to an empty array 
    public static CreateGroup(groupId: string): SocketSession[] {
        SocketSession.GroupStore.put(groupId, []);
        return [];
    }

    public static SetSessionTypingState(quizSession: string, state: boolean) {
        const socketSession = SocketSession.Store.get(quizSession);

        if (!socketSession) {
            throw Error(`Invalid quiz session with id ${quizSession}`);
        }

        socketSession.isTyping = state;
    }

    public static GetTypingStatesForGroup(groupId: string): number[] {
        const socketSessions = SocketSession.GroupStore.get(groupId);

        if (!socketSessions) {
            throw Error(`Invalid quiz session with id ${groupId}`);
        }        

        return socketSessions.reduce((arr: number[], element, index) => { if (element.isTyping) { arr.push(index); } return arr; }, [])

    }


    private constructor(quizSessionId: string) {
        this.quizSessionId = quizSessionId;

        SocketSession.Store.put(quizSessionId, this);
    }

    public setSocket(socket: PacSeqSocket_Server) {
        if (this.socketAlreadySaved(socket)) {
            // Don't do anything if socket previously set
            return;
        }

        this.sockets.push(socket);
    }

    public getSocket(): PacSeqSocket_Server | undefined {
        // Return the most up to date socket
        return this.sockets[this.sockets.length - 1];
    }

    private socketPosition(socket: PacSeqSocket_Server) {
        // Check by matching ID
        for (let i = 0; i < this.sockets.length; i++) {
            const _socket = this.sockets[i];

            if (_socket.id === socket.id) {
                return i;
            }
        }

        return -1;
    }

    private socketAlreadySaved(socket: PacSeqSocket_Server) {
        return this.socketPosition(socket) > -1;
    }

    private removeFromStore() {
        SocketSession.Store.delete(this.quizSessionId);
    }

    public destroyInstance() {
        this.removeFromStore();

        delete this.quizSessionId;
        delete this.sockets;
        delete this.isTyping;
    }
}
