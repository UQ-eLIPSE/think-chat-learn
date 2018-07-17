import * as $ from "jquery";

import {MoocchatSession} from "./MoocchatSession";
import * as IWSToClientData from "../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../common/interfaces/IWSToServerData";

import {WebsocketEvents} from "./WebsocketEvents";

/**
 * MOOCchat
 * Chat class module
 * 
 * Handles the communication to/from server during chat session and display of messages.
 */
export class MoocchatChat {
    private session: MoocchatSession<any>;
    private groupData: ChatGroupData;

    private $chatWindow: JQuery;

    private receiveMessageCallback: (data: IWSToClientData.ChatGroupMessage) => void;
    private receiveQuitStatusChangeCallback: (data: IWSToClientData.ChatGroupQuitStatusChange) => void;
    private receiveTypingNotificationCallback: (data: IWSToClientData.ChatGroupTypingNotification) => void;
    private receiveSystemMessageCallback: (data: IWSToClientData.ChatGroupSystemMessage) => void;
    /**
     * @param {MoocchatSession} session MoocchatSession object for the current user
     * @param {ChatGroupData} groupData Data initially received from server when the chat session was first set up
     * @param {JQuery} $chatWindow The JQuery wrapped chat window element
     */
    constructor(session: MoocchatSession<any>, groupData: ChatGroupData, $chatWindow: JQuery) {
        this.session = session;
        this.groupData = groupData;
        this.$chatWindow = $chatWindow;

        this.attachReceiveMessageHandler();

        this.$chatWindow.attr("data-self-client-id", (this.clientIndex + 1).toString());
    }

    public get chatWindow() {
        return this.$chatWindow;
    }

    public get clientIndex() {
        return this.groupData.clientIndex;
    }

    /**
     * Terminates the chat session and cleans up handlers.
     */
    public terminate() {
        this.detachReceiveMessageHandler();

        this.session.socket.emitData<IWSToServerData.ChatGroupQuitStatusChange>(WebsocketEvents.OUTBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, {
            groupId: this.groupData.groupId,
            quizAttemptId: this.session.quizAttemptId,
            quitStatus: true    // Indicate we are quitting
        });
    }

    /**
     * Sends a message as the current user.
     * 
     * @param {string} message
     */
    public sendMessage(message: string) {
        this.session.socket.emitData<IWSToServerData.ChatGroupSendMessage>(WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, {
            groupId: this.groupData.groupId,
            quizAttemptId: this.session.quizAttemptId,
            message: message
        });
    }

    /**
     * Handler to display received chat messages.
     * 
     * @param {IEventData_ChatGroupMessageReceived} data
     */
    private receiveMessage(data: IWSToClientData.ChatGroupMessage) {
        this.displayMessage(data.clientIndex + 1, data.message);
    }

    /**
     * Handler to display received system chat messages.
     * 
     * @param data
     */
    private receiveSystemMessage(data: IWSToClientData.ChatGroupSystemMessage) {
        this.displaySystemMessage(data.message, true);
    }

    /**
     * Displays message in chat window.
     * 
     * @param {number} clientId Client identification number (generally `clientIndex + 1`)
     * @param {string} message 
     * @param {boolean} forceNewBlock
     */
    public displayMessage(clientId: number, message: string, forceNewBlock: boolean = false) {
        const $message = $("<p>").text(message);

        const $lastPersonBlock = $("blockquote.message", this.chatWindow).last();
        const lastPersonClientId = $lastPersonBlock.data("client-id");

        if (!forceNewBlock &&
            lastPersonClientId &&
            lastPersonClientId.toString() === clientId.toString()) {
            $message.appendTo($lastPersonBlock);
        } else {
            const newBlockquote = $("<blockquote>")
                .addClass("message")
                .attr("data-client-id", clientId.toString())
                .append($message);

            if ($lastPersonBlock.length) {
                newBlockquote.insertAfter($lastPersonBlock);
            } else {
                newBlockquote.prependTo(this.chatWindow);
            }
        }

        // TODO: Don't scroll if window not scrolled to bottom as user might be looking at chat log
        this.chatWindow.scrollTop(this.chatWindow.get(0).scrollHeight);
    }

    /**
     * Displays a message from a user purporting to be the system (`clientId = -1`)
     * 
     * @param {string} message 
     * @param {boolean} forceNewBlock
     */
    public displaySystemMessage(message: string, forceNewBlock: boolean = false) {
        this.displayMessage(-1, message, forceNewBlock);
    }

    public sendTypingState(isTyping: boolean) {
        this.session.socket.emitData<IWSToServerData.ChatGroupTypingNotification>(WebsocketEvents.OUTBOUND.CHAT_GROUP_TYPING_NOTIFICATION, {
            groupId: this.groupData.groupId,
            quizAttemptId: this.session.quizAttemptId,
            isTyping: isTyping
        });
    }

    public displayTypingNotification(clientIndicies: number[]) {
        let message: string;

        // Remove self from notifications
        clientIndicies = clientIndicies.filter(clientIndex => clientIndex !== this.clientIndex);

        $("blockquote.typing-notification", this.chatWindow).remove();

        if (clientIndicies.length === 0) {
            return;
        }

        if (clientIndicies.length === 1) {
            message = `#${clientIndicies[0] + 1} is typing...`
        } else {
            message = `${clientIndicies.sort().map(clientIndex => `#${clientIndex + 1}`).join(", ")} are typing...`
        }

        $("<blockquote>")
            .addClass("typing-notification")
            .append($("<p>").text(message))
            .appendTo(this.chatWindow);

        // TODO: Don't scroll if window not scrolled to bottom as user might be looking at chat log
        this.chatWindow.scrollTop(this.chatWindow.get(0).scrollHeight);
    }

    /**
     * Handler for chat member quit updates.
     * 
     * @param {IEventData_ChatGroupQuitChange} data
     */
    private receiveQuitStatusChange(data: IWSToClientData.ChatGroupQuitStatusChange) {
        if (data.quitStatus) {
            const clientId = data.clientIndex + 1;
            this.displaySystemMessage(`Person #${clientId} has quit this chat session.`, true);
        }
    }

    private receiveTypingNotification(data: IWSToClientData.ChatGroupTypingNotification) {
        this.displayTypingNotification(data.clientIndicies);
    }

    /**
     * Attaches the incoming message event handler.
     */
    private attachReceiveMessageHandler() {
        this.receiveMessageCallback = this.receiveMessage.bind(this);
        this.receiveQuitStatusChangeCallback = this.receiveQuitStatusChange.bind(this);
        this.receiveTypingNotificationCallback = this.receiveTypingNotification.bind(this);
        this.receiveSystemMessageCallback = this.receiveSystemMessage.bind(this);

        this.session.socket.on<IWSToClientData.ChatGroupMessage>(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.on<IWSToClientData.ChatGroupSystemMessage>(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_SYSTEM_MESSAGE, this.receiveSystemMessageCallback);
        this.session.socket.on<IWSToClientData.ChatGroupQuitStatusChange>(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
        this.session.socket.on<IWSToClientData.ChatGroupTypingNotification>(WebsocketEvents.INBOUND.CHAT_GROUP_TYPING_NOTIFICATION, this.receiveTypingNotificationCallback);
    }

    /**
     * Detaches the incoming message event handler.
     */
    private detachReceiveMessageHandler() {
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_TYPING_NOTIFICATION, this.receiveTypingNotificationCallback);
    }

    /**
     * Fires chat group join request for a given session.
     * 
     * @param {MoocchatSession} session
     * @param {Function} callback Callback to fire when group formed
     */
    public static EmitJoinRequest<StateTypeEnum>(session: MoocchatSession<StateTypeEnum>, callback: (data: IWSToClientData.ChatGroupFormed) => void) {
        session.socket.once<IWSToClientData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, callback);
        session.socket.emitData<IWSToServerData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
            quizAttemptId: session.quizAttemptId
        });
    }
}

/** Alias for the interface for data that was originally received when chat group was first formed */
export type ChatGroupData = IWSToClientData.ChatGroupFormed;
