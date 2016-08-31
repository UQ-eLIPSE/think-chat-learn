declare const global: any;

import {MoocchatUserSession} from "./MoocchatUserSession";


const io: SocketIO.Server = global.io;


export class MoocchatChatGroup {
    private static ChatGroups: { [chatGroupId: string]: MoocchatChatGroup } = {};

    private _sessions: MoocchatUserSession[] = [];
    private _quitSessions: MoocchatUserSession[] = [];
    
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
            screenName: "",         // No longer used
            clientIndex: this.getSessionIndex(session),
            message: message,
            timestamp: Date.now()
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
            quitQueueSize: 0,       // No longer used

            screenName: "",         // No longer used
            clientIndex: this.getSessionIndex(quittingSession),
            quitStatus: quitStatus
        });
    }

    public quitSession(quittingSession: MoocchatUserSession) {
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

                screenName: "",     // No longer used
                clientIndex: this.getSessionIndex(session)
            });
        })
    }
}