import { IMoocchatIdentityInfo } from "../auth/IMoocchatIdentityInfo";

import { KVStore } from "../../../common/js/KVStore";

export class User {
    private static SingletonStore = new KVStore<User>();

    private readonly identity: IMoocchatIdentityInfo;

    /**
     * Gets all active user objects.
     * 
     * @static
     * @returns {Session[]}
     */
    public static GetUsers() {
        return User.SingletonStore.getValues();
    }

    /**
     * Gets all active user IDs.
     * 
     * @static
     * @returns {string[]}
     */
    public static GetUserIds() {
        return User.SingletonStore.getKeys();
    }

    /**
     * Destroys user object.
     * 
     * @static
     * @param {User} user
     */
    public static Destroy(user: User) {
        const id = user.getId();
        User.SingletonStore.delete(id);
    }

    /**
     * Destroys all user objects.
     * 
     * @static
     */
    public static DestroyAll() {
        User.GetUsers().forEach(user => User.Destroy(user));
    }

    constructor(identity: IMoocchatIdentityInfo) {
        const id = identity.identityId;

        if (!id) {
            throw new Error(`Missing identity ID in supplied identity object`);
        }

        // If existing user exists, then return that
        const existingSession = User.SingletonStore.get(id);

        if (existingSession) {
            return existingSession;
        }

        // Set up user
        this.identity = identity;

        // Keep track of this new session in singleton store
        User.SingletonStore.put(id, this);

        return this;
    }

    public getIdentity() {
        return this.identity;
    }

    /**
     * @returns {string} ID of the User object
     */
    public getId() {
        return this.getIdentity().identityId;
    }

    public isAdmin() {
        return this.getIdentity().roles.some((role) => {
            switch (role) {
                case "TeachingAssistant":
                case "Instructor":
                case "Administrator":
                    return true;
            }

            return false;
        });
    }
}