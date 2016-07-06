import * as $ from "jquery";

import {MoocchatSession} from "./MoocchatSession";
import {IEventData_ChatGroupFormed, IEventData_ChatGroupMessageReceived, IEventData_ChatGroupQuitChange} from "./IEventData";

import {WebsocketEvents} from "./Websockets";

/** Alias for the interface for data that was originally received when chat group was first formed */
export type ChatGroupData = IEventData_ChatGroupFormed;

/**
 * MOOCchat
 * Chat class module
 * 
 * Handles the communication to/from server during chat session and display of messages.
 */
export class MoocchatChat {
    private session: MoocchatSession<any>
    private groupData: ChatGroupData;
    private $chatWindow: JQuery;

    private receiveMessageCallback: Function;
    private receiveQuitStatusChangeCallback: Function;

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

        this.$chatWindow.attr("data-self-client-id", (this.groupData.clientIndex + 1).toString());
    }

    /**
     * Terminates the chat session and cleans up handlers.
     */
    public terminate() {
        this.detachReceiveMessageHandler();

        this.session.socket.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, {
            groupId: this.groupData.groupId,
            sessionId: this.session.sessionId,
            quitStatus: true    // Indicate we are quitting
        });
    }

    /**
     * Sends a message as the current user.
     * 
     * @param {string} message
     */
    public sendMessage(message: string) {
        this.session.socket.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, {
            groupId: this.groupData.groupId,
            sessionId: this.session.sessionId,
            message: message
        });
    }

    /**
     * Handler to display received chat messages.
     * 
     * @param {IEventData_ChatGroupMessageReceived} data
     */
    private receiveMessage(data: IEventData_ChatGroupMessageReceived) {
        this.displayMessage(data.clientIndex + 1, data.message);
    }

    /**
     * Displays message in chat window.
     * 
     * @param {number} clientId Client identification number (generally `clientIndex + 1`)
     * @param {string} message 
     */
    public displayMessage(clientId: number, message: string) {
        var $message = $("<p>").text(message);

        var $lastPersonBlock = $("blockquote:last-child", this.$chatWindow);
        var lastPersonClientId = $lastPersonBlock.data("client-id");

        if (lastPersonClientId &&
            lastPersonClientId.toString() === clientId.toString()) {
            $message.appendTo($lastPersonBlock);
        } else {
            $("<blockquote>")
                .attr("data-client-id", clientId.toString())
                .append($message)
                .appendTo(this.$chatWindow);
        }

        // TODO: Don't scroll if window not scrolled to bottom as user might be looking at chat log
        this.$chatWindow.scrollTop(this.$chatWindow.get(0).scrollHeight);
    }

    /**
     * Displays a message from a user purporting to be the system (`clientId = -1`)
     * 
     * @param {string} message 
     */
    public displaySystemMessage(message: string) {
        this.displayMessage(-1, message);
    }

    /**
     * Handler for chat member quit updates.
     * 
     * @param {IEventData_ChatGroupQuitChange} data
     */
    private receiveQuitStatusChange(data: IEventData_ChatGroupQuitChange) {
        if (data.quitStatus) {
            let clientId = data.clientIndex + 1;
            this.displaySystemMessage(`Person #${clientId} has quit this chat session.`)
        }
    }

    /**
     * Attaches the incoming message event handler.
     */
    private attachReceiveMessageHandler() {
        this.receiveMessageCallback = this.receiveMessage.bind(this);
        this.receiveQuitStatusChangeCallback = this.receiveQuitStatusChange.bind(this);

        this.session.socket.on(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.on(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
    }

    /**
     * Detaches the incoming message event handler.
     */
    private detachReceiveMessageHandler() {
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
    }
}
