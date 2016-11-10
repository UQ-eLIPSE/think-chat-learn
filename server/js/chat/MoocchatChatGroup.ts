// import {MoocchatUserSession} from "../user/MoocchatUserSession";

export class MoocchatChatGroup {
    private static ChatGroups: { [chatGroupId: string]: MoocchatChatGroup } = {};

    private _sessions: MoocchatUserSession[] = [];
    private _quitSessions: MoocchatUserSession[] = [];
    private _typingSessions: MoocchatUserSession[] = [];

    private _id: string;

    public static GetChatGroup(chatGroupId: string) {
        return MoocchatChatGroup.ChatGroups[chatGroupId];
    }

    public static GetChatGroupWith(session: MoocchatUserSession) {
        const chatGroupIds = Object.keys(MoocchatChatGroup.ChatGroups);

        for (let i = 0; i < chatGroupIds.length; i++) {
            const chatGroup = MoocchatChatGroup.ChatGroups[chatGroupIds[i]];

            if (chatGroup.getSessions().indexOf(session) > -1) {
                return chatGroup;
            }
        }

        return undefined;
    }

    public static Destroy(chatGroup: MoocchatChatGroup) {
        const chatGroupId = chatGroup.getId();

        console.log(`MoocchatChatGroup(${chatGroupId}) DESTROYING`);

        chatGroup._id = undefined;
        chatGroup._sessions = [];

        delete MoocchatChatGroup.ChatGroups[chatGroupId];
    }

    constructor(sessions: MoocchatUserSession[]) {
        this._id = require('crypto').randomBytes(16).toString('hex');
        this._sessions = sessions;

        // Put into singleton map
        MoocchatChatGroup.ChatGroups[this.getId()] = this;

        this.joinSessionsToRoom();
        this.notifyEveryoneOnJoin();
    }

    public getId() {
        return this._id;
    }

    public getSessions() {
        return this._sessions;
    }

    private joinSessionsToRoom() {
        const chatGroupId = this.getId();

        this._sessions.forEach((session) => {
            console.log(`MoocchatChatGroup(${chatGroupId}) JOIN Session '${session.getId()}'`);
        });
    }

    public broadcast(event: string, data: any) {
        this.getSessions().forEach((session) => {
            // Don't broadcast message to those already quit
            if (this._quitSessions.indexOf(session) > -1) {
                return;
            }

            const sessionSocket = session.getSocket();

            if (sessionSocket) {
                sessionSocket.emit(event, data);
            }
        });
    }

    public numberOfSessions() {
        return this._sessions.length - this._quitSessions.length;
    }

    private getSessionIndex(session: MoocchatUserSession) {
        return this._sessions.indexOf(session);
    }

    public broadcastMessage(session: MoocchatUserSession, message: string) {
        this.broadcast("chatGroupMessage", {
            clientIndex: this.getSessionIndex(session),
            message: message,
            timestamp: Date.now()
        });

        // Remove the session that just sent the message from the typing sessions array
        this.setTypingState(session, false);
    }

    public setTypingState(session: MoocchatUserSession, isTyping: boolean) {
        const sessionIndex = this._typingSessions.indexOf(session);

        if (isTyping && sessionIndex < 0) {
            this._typingSessions.push(session);
        } else if (!isTyping && sessionIndex > -1) {
            this._typingSessions.splice(sessionIndex, 1);
        }

        this.updateTypingNotifications();
    }

    private updateTypingNotifications() {
        this.broadcast("chatGroupTypingNotification", {
            clientIndicies: this._typingSessions.map(session => this.getSessionIndex(session))
        });
    }

    private broadcastQuit(quittingSession: MoocchatUserSession, quitStatus: boolean = true) {
        // Don't broadcast quit event when the session has already quit
        if (this._quitSessions.indexOf(quittingSession) > -1) {
            return;
        }

        this.broadcast("chatGroupQuitChange", {
            groupId: this.getId(),
            groupSize: this.numberOfSessions(),

            clientIndex: this.getSessionIndex(quittingSession),
            quitStatus: quitStatus
        });
    }

    public quitSession(quittingSession: MoocchatUserSession) {
        this.setTypingState(quittingSession, false);
        
        // You must broadcast the quit BEFORE actually quitting
        this.broadcastQuit(quittingSession);

        // If not previously tracked as quitted, add to quit array
        if (this._quitSessions.indexOf(quittingSession) < 0) {
            console.log(`MoocchatChatGroup(${this.getId()}) QUIT Session '${quittingSession.getId()}'`);
            this._quitSessions.push(quittingSession);
        }

        // Self destroy when there are no sessions left
        if (this.numberOfSessions() === 0) {
            MoocchatChatGroup.Destroy(this);
        }
    }

    private notifyEveryoneOnJoin() {
        const chatGroupId = this.getId();
        const numberOfSessionsInGroup = this.numberOfSessions();
        const sessionsInGroup = this.getSessions();

        sessionsInGroup.forEach((session) => {
            session.getSocket().emit("chatGroupFormed", {
                groupId: chatGroupId,
                groupSize: numberOfSessionsInGroup,
                groupAnswers: sessionsInGroup.map((_session) => {
                    return {
                        clientIndex: this.getSessionIndex(_session),
                        answer: _session.data.response.initial
                    };
                }),

                clientIndex: this.getSessionIndex(session)
            });
        })
    }
}