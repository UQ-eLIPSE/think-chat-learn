import { Conf } from "../../config/Conf";

import { KVStore } from "../../../common/js/KVStore";

import { IMoocchatIdentityInfo } from "../auth/IMoocchatIdentityInfo";

/**
 * Keeps track of user sessions and validates them 
 * 
 * @export
 * @class Session
 */
export class Session {
    public static readonly Timeout = Conf.session.timeoutMs;

    private static readonly SingletonStore = new KVStore<Session>();

    private readonly id: string;
    private readonly identity: IMoocchatIdentityInfo;
    private readonly store: KVStore<any>;

    private lastActive: number;
    private destroyed: boolean;

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
     * @param {string} identityId
     * @returns
     */
    public static GetSessionsOfUser(identityId: string) {
        return Session.GetSessions().filter(session => session.getIdentityId() === identityId);
    }

    /**
     * Gets session objects associated with course.
     * 
     * @static
     * @param {string} course
     * @returns
     */
    public static GetSessionsOfCourse(course: string) {
        return Session.GetSessions().filter(session => session.getCourse() === course);
    }

    /**
     * Destroys session object.
     * 
     * @static
     * @param {Session} session
     */
    public static Destroy(session: Session) {
        session.destroyed = true;

        const id = session.getId();
        Session.SingletonStore.delete(id);
    }

    /**
     * Destroys session objects associated with user.
     * 
     * @static
     * @param {string} identityId
     */
    public static DestroySessionsOfUser(identityId: string) {
        Session.GetSessionsOfUser(identityId).forEach(session => Session.Destroy(session));
    }

    /**
     * Destroys all session objects.
     * 
     * @static
     */
    public static DestroyAll() {
        Session.GetSessions().forEach(session => Session.Destroy(session));
    }

    /**
     * Cleans sessions that are no longer valid.
     * 
     * @static
     */
    public static CleanSessions() {
        Session.GetSessions()
            .filter(session => !session.isValid())
            .forEach(session => Session.Destroy(session));
    }

    constructor(id: string, identity?: IMoocchatIdentityInfo) {
        const existingSession = Session.SingletonStore.get(id);

        // If no user supplied, we are retrieving a session
        if (!identity) {
            if (!existingSession) {
                throw new Error(`Session with ID "${id}" is not valid, has expired, or has been destroyed`);
            }

            // Check session is valid
            if (!existingSession.isValid()) {
                throw new Error(`Session with ID "${existingSession.getId()}" is not valid, has expired, or has been destroyed`);
            }

            // Update activity time to keep session alive/prevent timeout
            existingSession.updateActivityTime();

            return existingSession;
        }

        // If session already exists when attempting to create a new session object,
        // stop as we should not be able to overwrite an existing session
        if (existingSession) {
            throw new Error(`Session with ID "${existingSession.getId()}" exists and cannot be overwritten`);
        }

        // Set up session
        this.id = id;
        this.identity = identity;
        this.store = new KVStore<any>();

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
     * @returns {IMoocchatIdentityInfo} Identity information associated with session
     */
    public getIdentity() {
        return this.identity;
    }

    /**
     * @returns {KVStore} Store associated with session
     */
    public getStore() {
        return this.store;
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

        // Session invalid if set "destroyed"
        if (this.destroyed) {
            return false;
        }

        // Check timeout
        if (this.getInactivityTime() > Session.Timeout) {
            return false;
        }

        return true;
    }

    public getIdentityId() {
        return this.getIdentity().identityId;
    }

    public isAdmin() {
        const roles = this.getRoles();

        if (!roles) {
            return false;
        }

        return roles.some((role) => {
            switch (role.toLowerCase()) {
                case "teachingassistant":
                case "instructor":
                case "administrator":
                    return true;
            }

            return false;
        });
    }

    public getRoles() {
        return this.getIdentity().roles;
    }

    public getCourse() {
        return this.getIdentity().course;
    }
}