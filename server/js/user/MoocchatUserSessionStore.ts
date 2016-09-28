import {MoocchatUserSession} from "./MoocchatUserSession";

export class MoocchatUserSessionStore {
    private store: MoocchatUserSession[] = [];

    private indexOf(session: MoocchatUserSession) {
        return this.store.indexOf(session);
    }

    public has(session: MoocchatUserSession) {
        return this.indexOf(session) > -1;
    }

    public getSessionIds() {
        return this.store.map((userSession) => {
            return userSession.getId();
        });
    }

    public getSession(sessionId: string) {
        for (let i = 0; i < this.store.length; ++i) {
            const userSession = this.store[i];
            
            if (userSession.getId() === sessionId) {
                return userSession;
            }
        }

        return undefined;
    }

    public getSessionByUserId(userId: string) {
        for (let i = 0; i < this.store.length; ++i) {
            const userSession = this.store[i];
            
            if (userSession.getUserId() === userId) {
                return userSession;
            }
        }

        return undefined;
    }

    public add(session: MoocchatUserSession) {
        if (this.has(session)) {
            return undefined;
        }

        return this.store.push(session);
    }

    public remove(session: MoocchatUserSession) {
        if (this.has(session)) {
            return this.store.splice(this.indexOf(session), 1)[0];
        }

        return undefined;
    }

}