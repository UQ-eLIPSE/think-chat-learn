define(["require", "exports", "socket.io-client"], function (require, exports, socket) {
    "use strict";
    exports.WebsocketEvents = {
        INBOUND: {
            LOGIN_SUCCESS: "loginSuccess",
            LOGIN_FAILURE: "loginFailure",
            LOGIN_USER_ALREADY_EXISTS: "loginExistingUser",
            INITIAL_ANSWER_SUBMISSION_SAVED: "answerSubmissionInitialSaved",
            CHAT_GROUP_FORMED: "chatGroupFormed",
            CHAT_GROUP_RECEIVE_MESSAGE: "chatGroupMessage"
        },
        OUTBOUND: {
            LOGIN_REQUEST: "login_req",
            INITIAL_ANSWER_SUBMISSION: "answerSubmissionInitial",
            CHAT_GROUP_JOIN_REQUEST: "chatGroupJoinRequest",
            CHAT_GROUP_SEND_MESSAGE: "chatGroupMessage",
            REVISED_ANSWER_SUBMISSION: "probingQuestionFinalAnswerSubmission"
        }
    };
    var WebsocketManager = (function () {
        function WebsocketManager() {
        }
        WebsocketManager.prototype.open = function () {
            this.socket = socket.connect({
                path: "/socket.io",
                transports: ["websocket"]
            });
        };
        WebsocketManager.prototype.close = function () {
            this.socket.close();
        };
        WebsocketManager.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return (_a = this.socket).emit.apply(_a, [event].concat(args));
            var _a;
        };
        WebsocketManager.prototype.on = function (event, fn) {
            return this.socket.on(event, fn);
        };
        WebsocketManager.prototype.off = function (event, fn) {
            return this.socket.off(event, fn);
        };
        WebsocketManager.prototype.once = function (event, fn) {
            return this.socket.once(event, fn);
        };
        return WebsocketManager;
    }());
    exports.WebsocketManager = WebsocketManager;
});
//# sourceMappingURL=Websockets.js.map