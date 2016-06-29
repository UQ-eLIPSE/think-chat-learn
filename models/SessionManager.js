/**
 * SessionManager
 *
 */

"use strict";

var Session = require("./Session");

/**
 * IActiveSessionData = {
 *      session: Session;
 *      lastTime: number;       // Last known activity time in milliseconds
 * }
 */

/**
 * @param {number} timeout Timeout in milliseconds
 */
var SessionManager = function(timeout) {
    this.activeSessions = {};
    this.timeout = timeout || (1 * 60 * 60 * 1000); // milliseconds; default = 1 hour
}

/**
 * @param {Session} session
 */
SessionManager.prototype.addSession = function(session) {
    // Wrap session with last time info
    this.activeSessions[session.id] = {
        session: session,
        lastTime: 0
    };

    // Run keep active now to fill in `lastTime`
    this.keepSessionActive(session);
}

/**
 * @param {Session} session
 */
SessionManager.prototype.removeSession = function(session) {
    delete this.activeSessions[session.id];
}

/**
 * @param {string} sessionId
 */
SessionManager.prototype.getSessionById = function(sessionId) {
    if (!this.hasSessionId(sessionId)) {
        return;
    }

    // Remember to unwrap object contained in this.activeSessions
    return this.activeSessions[sessionId].session;
}

/**
 * @param {Socket} socket
 */
SessionManager.prototype.getSessionBySocket = function(socket) {
    var sessionIds = Object.keys(this.activeSessions);

    for (var i = 0; i < sessionIds.length; ++i) {
        var sessionId = sessionIds[i];

        var session = this.activeSessions[sessionId].session;

        if (session.client && session.client.socket === socket) {
            return session;
        }
    }
}

/**
 * @param {string} sessionId
 * 
 * @return {boolean}
 */
SessionManager.prototype.hasSessionId = function(sessionId) {
    return Object.keys(this.activeSessions).indexOf(sessionId) > -1;
}

/**
 * @param {Session} session
 * 
 * @return {boolean}
 */
SessionManager.prototype.hasSession = function(session) {
    return this.hasSessionId(session.id);
}

/**
 * @param {Session} session
 * 
 * @return {boolean}
 */
SessionManager.prototype.isSessionValid = function(session) {
    if (!this.hasSession(session)) {
        return false;
    }

    // Timeout passed
    if ((this.activeSessions[session.id].lastTime + this.timeout) < Date.now()) {
        return false;
    }

    return true;
}

/**
 * @param {Session} session
 */
SessionManager.prototype.keepSessionActive = function(session) {
    this.activeSessions[session.id].lastTime = Date.now();
}

/**
 * @param {string} username
 */
SessionManager.prototype.hasSessionWithUsername = function(username) {
    var sessionIds = Object.keys(this.activeSessions);

    for (var i = 0; i < sessionIds.length; ++i) {
        var sessionId = sessionIds[i];

        var session = this.activeSessions[sessionId].session;

        if (session.client && session.client.username === username) {
            return true;
        }
    }

    return false;
}

module.exports = SessionManager;