import { KVStore } from "../../../common/js/KVStore";

import { PacSeqSocket_Server } from "../../../common/js/PacSeqSocket_Server";

// Refers to...
import { UserSession } from "../user/UserSession";

export class SocketSession {
    private static readonly Store = new KVStore<SocketSession>();

    private readonly userSession: UserSession;
    private readonly sockets: PacSeqSocket_Server[] = [];

    public static Get(userSession: UserSession) {
        return SocketSession.Store.get(userSession.getId());
    }

    public static GetAutoCreate(userSession: UserSession) {
        const socketSession = SocketSession.Get(userSession);

        if (socketSession) {
            return socketSession;
        }

        return SocketSession.Create(userSession);
    }

    public static Create(userSession: UserSession) {
        return new SocketSession(userSession);
    }

    private constructor(userSession: UserSession) {
        this.userSession = userSession;
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
        SocketSession.Store.delete(this.userSession.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        delete this.userSession;
        delete this.sockets;
    }
}