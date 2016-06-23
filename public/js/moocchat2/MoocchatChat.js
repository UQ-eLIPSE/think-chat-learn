define(["require", "exports", "jquery", "./Websockets"], function (require, exports, $, Websockets_1) {
    "use strict";
    var MoocchatChat = (function () {
        function MoocchatChat(session, groupData, $chatWindow) {
            this.session = session;
            this.groupData = groupData;
            this.$chatWindow = $chatWindow;
            this.attachReceiveMessageHandler();
            this.$chatWindow.attr("data-self-client-id", (this.groupData.clientIndex + 1).toString());
        }
        Object.defineProperty(MoocchatChat.prototype, "screenName", {
            get: function () {
                return this.groupData.screenName;
            },
            enumerable: true,
            configurable: true
        });
        MoocchatChat.prototype.terminate = function () {
            this.detachReceiveMessageHandler();
        };
        MoocchatChat.prototype.sendMessage = function (message) {
            this.session.socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, {
                groupId: this.groupData.groupId,
                username: this.session.user.username,
                message: message
            });
        };
        MoocchatChat.prototype.receiveMessage = function (data) {
            this.displayMessage(data.clientIndex + 1, data.message);
        };
        MoocchatChat.prototype.attachReceiveMessageHandler = function () {
            this.session.socket.on(Websockets_1.WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessage.bind(this));
        };
        MoocchatChat.prototype.detachReceiveMessageHandler = function () {
            var res = this.session.socket.off(Websockets_1.WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE, this.receiveMessage);
            console.log(res.listeners(Websockets_1.WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE));
        };
        MoocchatChat.prototype.displayMessage = function (clientId, message) {
            var $message = $("<p>").text(message);
            var $lastPersonBlock = $("blockquote:last-child", this.$chatWindow);
            var lastPersonClientId = $lastPersonBlock.data("client-id");
            if (lastPersonClientId &&
                lastPersonClientId.toString() === clientId.toString()) {
                $message.appendTo($lastPersonBlock);
            }
            else {
                $("<blockquote>")
                    .attr("data-client-id", clientId.toString())
                    .append($message)
                    .appendTo(this.$chatWindow);
            }
            this.$chatWindow.scrollTop(this.$chatWindow.get(0).scrollHeight);
        };
        MoocchatChat.prototype.displaySystemMessage = function (message) {
        };
        MoocchatChat.prototype.handleQuitStatusChange = function () {
        };
        return MoocchatChat;
    }());
    exports.MoocchatChat = MoocchatChat;
});
//# sourceMappingURL=MoocchatChat.js.map