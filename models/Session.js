/**
 * Session
 * 
 */

"use strict";

var Client = require("./client");

/**
 * @param {Client} client
 */
var Session = function(client) {
    this.id = require('crypto').randomBytes(16).toString('hex');    // {string}
    this.client = client;
    this.hasElevatedPermissions = false;
}

/**
 * @param {boolean} value
 */
Session.prototype.setElevatedPermissions = function(value) {
    this.hasElevatedPermissions = value;
}

module.exports = Session;