import * as $ from "jquery";

import {MoocchatSession} from "./MoocchatSession";
import * as IInboundData from "./IInboundData";
import * as IOutboundData from "./IOutboundData";

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

    private receiveMessageCallback: (data: IInboundData.ChatGroupMessage) => void;
    private receiveQuitStatusChangeCallback: (data: IInboundData.ChatGroupQuitStatusChange) => void;

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

    public get chatWindow() {
        return this.$chatWindow;
    }

    /**
     * Terminates the chat session and cleans up handlers.
     */
    public terminate() {
        this.detachReceiveMessageHandler();

        this.session.socket.emitData<IOutboundData.ChatGroupQuitStatusChange>(WebsocketEvents.OUTBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, {
            groupId: this.groupData.groupId,
            sessionId: this.session.id,
            quitStatus: true    // Indicate we are quitting
        });
    }

    /**
     * Sends a message as the current user.
     * 
     * @param {string} message
     */
    public sendMessage(message: string) {
        this.session.socket.emitData<IOutboundData.ChatGroupSendMessage>(WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, {
            groupId: this.groupData.groupId,
            sessionId: this.session.id,
            message: message
        });
    }

    /**
     * Handler to display received chat messages.
     * 
     * @param {IEventData_ChatGroupMessageReceived} data
     */
    private receiveMessage(data: IInboundData.ChatGroupMessage) {
        this.displayMessage(data.clientIndex + 1, data.message);
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

        const $lastPersonBlock = $("blockquote.message", this.$chatWindow).last();
        const lastPersonClientId = $lastPersonBlock.data("client-id");

        if (!forceNewBlock &&
            lastPersonClientId &&
            lastPersonClientId.toString() === clientId.toString()) {
            $message.appendTo($lastPersonBlock);
        } else {
            $("<blockquote>")
                .addClass("message")
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
     * @param {boolean} forceNewBlock
     */
    public displaySystemMessage(message: string, forceNewBlock: boolean = false) {
        this.displayMessage(-1, message, forceNewBlock);
    }

    /**
     * Handler for chat member quit updates.
     * 
     * @param {IEventData_ChatGroupQuitChange} data
     */
    private receiveQuitStatusChange(data: IInboundData.ChatGroupQuitStatusChange) {
        if (data.quitStatus) {
            const clientId = data.clientIndex + 1;
            this.displaySystemMessage(`Person #${clientId} has quit this chat session.`, true);
        }
    }

    /**
     * Attaches the incoming message event handler.
     */
    private attachReceiveMessageHandler() {
        this.receiveMessageCallback = this.receiveMessage.bind(this);
        this.receiveQuitStatusChangeCallback = this.receiveQuitStatusChange.bind(this);

        this.session.socket.on<IInboundData.ChatGroupMessage>(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.on<IInboundData.ChatGroupQuitStatusChange>(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
    }

    /**
     * Detaches the incoming message event handler.
     */
    private detachReceiveMessageHandler() {
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessageCallback);
        this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_QUIT_STATUS_CHANGE, this.receiveQuitStatusChangeCallback);
    }

    /**
     * Fires chat group join request for a given session.
     * 
     * @param {MoocchatSession} session
     * @param {Function} callback Callback to fire when group formed
     */
    public static EmitJoinRequest<StateTypeEnum>(session: MoocchatSession<StateTypeEnum>, callback: (data: IInboundData.ChatGroupFormed) => void) {
        session.socket.once<IInboundData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, callback);
        session.socket.emitData<IOutboundData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
            sessionId: session.id
        });
    }
}

/** Alias for the interface for data that was originally received when chat group was first formed */
export type ChatGroupData = IInboundData.ChatGroupFormed;
