export enum MoocChatMessageTypes {
    // Used for system wide messages (e.g. system shutdowns)
    SYSTEM_MESSAGE = "SYSTEM_MESSAGE",
    // Messages from other people (including self)
    CHAT_MESSAGE = "CHAT_MESSAGE",
    // Helps the user determine the state. E.g. Whether or not they have joined
    // Which client index the are etc.
    STATE_MESSAGE = "STATE_MESSAGE"
}

export enum MoocChatStateMessageTypes {
    // For joining a group
    ON_JOIN = "ON_JOIN",
    // Reforming a new group
    REFORM_GROUP = "REFORM_GROUP",
    // A new question has been added
    NEW_DISCUSSION_QUESTION = "NEW_DISCUSSION_QUESTION",
    // Someone has disconnected
    CHAT_GROUP_LEAVE = "CHAT_GROUP_LEAVE"
}
