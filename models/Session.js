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
}

module.exports = Session;