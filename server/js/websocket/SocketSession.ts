import { KVStore } from "../../../common/js/KVStore";

import { UserSession } from "../user/UserSession";

export class SocketSession {
    private static readonly Store = new KVStore<SocketSession>();

    public static Get(userSession: UserSession) {
        return SocketSession.Store.get(userSession.getId());
    }

    constructor(userSession: UserSession, socket?: PacSeqSocket_Server) {
        if (!socket) {
            const existingObj = SocketSession.get()
        }
    }

    public getSocket() {
        return this.socket;
    }
}