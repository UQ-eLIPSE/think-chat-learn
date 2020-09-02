export interface IMoocchatIdentityInfo {
    /**
     * Original authentication method or protocol that produced this identity.
     */
    _authName: string;

    /**
     * An identifier of the identity given by the auth source data.
     * 
     * This can be: username, student ID, record number as string etc.
     */
    identityId: string;

    /**
     * Name of the identity.
     */
    name: {
        // Full name is always required
        full: string;

        // Given + family may be given
        given?: string;
        family?: string;
    };

    /**
     * Course in which this identity sits (e.g. EAIT1033N_6760_00003)
     */
    course?: string;

    /**
     * Title of the course in which this identity sits (e.g. [EAIT1033] EAIT eLearning Development - Semester 2 2017.)
     */
    courseTitle?: string;

    /**
     * List of roles as string array.
     */
    roles?: string[];
}