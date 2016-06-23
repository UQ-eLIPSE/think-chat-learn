define(["require", "exports", "./Websockets"], function (require, exports, Websockets_1) {
    "use strict";
    var MoocchatUser = (function () {
        function MoocchatUser(username) {
            this.loginSuccessCallback = function () { };
            this.loginFailCallback = function () { };
            this._username = username;
        }
        Object.defineProperty(MoocchatUser.prototype, "username", {
            get: function () {
                return this._username;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatUser.prototype, "onLoginSuccess", {
            set: function (callback) {
                this.loginSuccessCallback = callback;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatUser.prototype, "onLoginFail", {
            set: function (callback) {
                this.loginFailCallback = callback;
            },
            enumerable: true,
            configurable: true
        });
        MoocchatUser.prototype.login = function (socket) {
            socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.LOGIN_REQUEST, {
                username: this.username,
                password: "ischool",
                turkHitId: undefined,
                browserInformation: navigator.userAgent
            });
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_SUCCESS, this.loginSuccessCallback);
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_FAILURE, this.loginFailCallback);
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, this.loginFailCallback);
        };
        return MoocchatUser;
    }());
    exports.MoocchatUser = MoocchatUser;
});
//# sourceMappingURL=MoocchatUser.js.map