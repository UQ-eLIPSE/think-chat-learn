define(["require", "exports", "./EventBox", "./Websockets"], function (require, exports, EventBox_1, Websockets_1) {
    "use strict";
    var MoocchatUser_InternalLoginEvents = {
        SUCCESS: "MCUSER_LOGIN_SUCCESS",
        FAIL: "MCUSER_LOGIN_FAIL"
    };
    var MoocchatUser = (function () {
        function MoocchatUser(username) {
            this.eventBox = new EventBox_1.EventBox();
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
                this.eventBox.on(MoocchatUser_InternalLoginEvents.SUCCESS, callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatUser.prototype, "onLoginFail", {
            set: function (callback) {
                this.eventBox.on(MoocchatUser_InternalLoginEvents.FAIL, callback);
            },
            enumerable: true,
            configurable: true
        });
        MoocchatUser.prototype.clearLoginCallbacks = function () {
            this.eventBox.destroy();
        };
        MoocchatUser.prototype.login = function (socket) {
            this.attachLoginReturnHandlers(socket);
            socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.LOGIN_REQUEST, {
                username: this.username,
                password: "ischool",
                turkHitId: undefined,
                browserInformation: navigator.userAgent
            });
        };
        MoocchatUser.prototype.attachLoginReturnHandlers = function (socket) {
            var _this = this;
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_SUCCESS, function (data) {
                _this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.SUCCESS, data);
                _this.detachLoginReturnHandlers(socket);
            });
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_FAILURE, function (data) {
                _this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.FAIL, data);
                _this.detachLoginReturnHandlers(socket);
            });
            socket.once(Websockets_1.WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS, function (data) {
                _this.eventBox.dispatch(MoocchatUser_InternalLoginEvents.FAIL, data);
                _this.detachLoginReturnHandlers(socket);
            });
        };
        MoocchatUser.prototype.detachLoginReturnHandlers = function (socket) {
            socket.off(Websockets_1.WebsocketEvents.INBOUND.LOGIN_SUCCESS);
            socket.off(Websockets_1.WebsocketEvents.INBOUND.LOGIN_FAILURE);
            socket.off(Websockets_1.WebsocketEvents.INBOUND.LOGIN_USER_ALREADY_EXISTS);
        };
        return MoocchatUser;
    }());
    exports.MoocchatUser = MoocchatUser;
});
