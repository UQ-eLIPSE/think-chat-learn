import { KVStore } from "../../../common/js/KVStore";

export class User {
    private static SingletonStore = new KVStore<User>();

    private readonly id: string;

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

    constructor(id: string) {
        // If existing user exists, then return that
        const existingSession = User.SingletonStore.get(id);

        if (existingSession) {
            return existingSession;
        }

        // Set up user
        this.id = id;

        // Keep track of this new session in singleton store
        User.SingletonStore.put(id, this);

        return this;
    }

    /**
     * @returns {string} ID of the User object
     */
    public getId() {
        return this.id;
    }
}