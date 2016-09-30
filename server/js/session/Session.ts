import { Conf } from "../../config/Conf";

import { KVStore } from "../../../common/js/KVStore";

import {User} from "../user/User";

/**
 * Keeps track of user sessions and validates them 
 * 
 * @export
 * @class Session
 */
export class Session {
    private static Timeout = Conf.session.timeoutMs;
    private static SingletonStore = new KVStore<Session>();

    private readonly id: string;
    private readonly user: User;

    private lastActive: number;

    /**
     * Gets all active session objects.
     * 
     * @static
     * @returns {Session[]}
     */
    public static GetSessions() {
        return Session.SingletonStore.getValues();
    }

    /**
     * Gets all active session IDs.
     * 
     * @static
     * @returns {string[]}
     */
    public static GetSessionIds() {
        return Session.SingletonStore.getKeys();
    }

    /**
     * Gets session objects associated with user.
     * 
     * @static
     * @param {User} user
     * @returns {Session[]}
     */
    public static GetSessionsOfUser(user: User) {
        return Session.GetSessions().filter(session => session.getUser() === user);
    }

    /**
     * Destroys session object.
     * 
     * @static
     * @param {Session} session
     */
    public static Destroy(session: Session) {
        const id = session.getId();
        Session.SingletonStore.delete(id);
    }

    /**
     * Destroys session objects associated with user.
     * 
     * @static
     * @param {User} user
     */
    public static DestroySessionsOfUser(user: User) {
        Session.GetSessionsOfUser(user).forEach(session => Session.Destroy(session));
    }

    /**
     * Destroys all session objects.
     * 
     * @static
     */
    public static DestroyAll() {
        Session.GetSessions().forEach(session => Session.Destroy(session));
    }

    constructor(id: string, user: User) {
        // If existing session exists, then return that
        const existingSession = Session.SingletonStore.get(id);

        if (existingSession) {
            if (existingSession.getUser() !== user) {
                throw new Error(`Existing session "${existingSession.getId()}" not associated with user "${user.getId()}"`);
            }
            return existingSession;
        }

        // Set up session
        this.id = id;
        this.user = user;

        this.updateActivityTime();

        // Keep track of this new session in singleton store
        Session.SingletonStore.put(id, this);

        return this;
    }

    /**
     * @returns {string} ID of the Session object
     */
    public getId() {
        return this.id;
    }

    /**
     * @returns {User} User associated with session
     */
    public getUser() {
        return this.user;
    }

    /**
     * @returns {number} Inactivity time in milliseconds
     */
    public getInactivityTime() {
        return Date.now() - this.getLastActiveTime();
    }

    public getLastActiveTime() {
        return this.lastActive;
    }

    public updateActivityTime() {
        return (this.lastActive = Date.now());
    }

    public isValid() {

        // Check timeout
        if (this.getInactivityTime() > Session.Timeout) {
            return false;
        }

        return true;
    }
}