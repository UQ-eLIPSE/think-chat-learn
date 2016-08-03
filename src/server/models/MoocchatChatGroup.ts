declare const global: any;

import {MoocchatUserSession} from "./MoocchatUserSession";


const io: SocketIO.Server = global.io;


export class MoocchatChatGroup {
    private static ChatGroups: { [chatGroupId: string]: MoocchatChatGroup } = {};

    private _sessions: MoocchatUserSession[];
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

        chatGroup.getSessions().forEach((session) => {
            console.log(`socket.io(${chatGroupId}) LEAVE Session '${session.getId()}'`);
            session.getSocket().leave(chatGroupId);
        });

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
            console.log(`socket.io(${chatGroupId}) JOIN Session '${session.getId()}'`);
            session.getSocket().join(chatGroupId);
        });
    }

    public broadcast(event: string, data: any) {
        // ======= Logging starts here =======

        var loggedData = [
            'socket.io(' + this.getId() + ')',
            'OUTBOUND',
            '[' + event + ']'
        ];

        if (typeof data !== "undefined") {
            loggedData.push(data);
        }

        console.log.apply(undefined, loggedData);

        // ======= Logging ends here =======

        io.sockets.in(this.getId()).emit(event, data);
    }

    public numberOfSessions() {
        return this._sessions.length;
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
        console.log(`Quitting session '${quittingSession.getId()}' from chat group '${this.getId()}'`);
        this.broadcastQuit(quittingSession);

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