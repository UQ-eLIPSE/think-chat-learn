import * as $ from "jquery";

import {MoocchatSession} from "./MoocchatSession";
import {IEventData_ChatGroupFormed, IEventData_ChatGroupMessageReceived} from "./IEventData";

import {WebsocketEvents} from "./Websockets";

/*
 * MOOCchat
 * Chat class module
 * 
 * 
 */

export type ChatGroupData = IEventData_ChatGroupFormed;

export class MoocchatChat {
    private session: MoocchatSession<any>
    private groupData: ChatGroupData;
    private $chatWindow: JQuery;

    constructor(session: MoocchatSession<any>, groupData: ChatGroupData, $chatWindow: JQuery) {
        this.session = session;
        this.groupData = groupData;
        this.$chatWindow = $chatWindow;

        this.attachReceiveMessageHandler();

        this.$chatWindow.attr("data-self-client-id", (this.groupData.clientIndex + 1).toString());
    }

    public get screenName() {
        return this.groupData.screenName;
    }



    public terminate() {
        this.detachReceiveMessageHandler();

        // TODO: Notify server
    }



    public sendMessage(message: string) {
        this.session.socket.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, {
            groupId: this.groupData.groupId,
            username: this.session.user.username,
            message: message
        });
    }

    private receiveMessage(data: IEventData_ChatGroupMessageReceived) {
        this.displayMessage(data.clientIndex + 1, data.message);
    }



    private attachReceiveMessageHandler() {
        this.session.socket.on(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessage.bind(this));
    }

    private detachReceiveMessageHandler() {
        let res = this.session.socket.off(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessage);

        console.log(res.listeners(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE));
    }



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

        this.$chatWindow.scrollTop(this.$chatWindow.get(0).scrollHeight);
    }

    public displaySystemMessage(message: string) {
        // TODO:
    }

    public handleQuitStatusChange() {
        // TODO:
    }
}
