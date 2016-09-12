/**
 * Tests for /models/ChatGroup
 */

"use strict";

var assert = require("chai").assert;

var io = global.io;
var Client = require("../../../build/server/js/models/client");
var ChatGroup = require("../../../build/server/js/models/ChatGroup");


describe("server/models/ChatGroup", function() {

    describe("#constructor", function() {
        var group1 = new ChatGroup();
        var group2 = new ChatGroup();

        it("should create ChatGroups which have non identical IDs", function() {
            assert.notStrictEqual(group1.id, group2.id);
        });

        it("should create ChatGroups with a blank slate", function() {
            assert.strictEqual(group1.log.length, 0);
            assert.strictEqual(group1.clientsQueuedToQuit.length, 0);
        });
    });

    describe("#numberOfClientsQueuedToQuit", function() {
        var newBlankGroup = new ChatGroup();

        it("should return `0` for a new ChatGroup", function() {
            assert.strictEqual(newBlankGroup.numberOfClientsQueuedToQuit(), 0);
        });

        // TODO: Need to process clients into the chat group (i.e. add; request quit)
        // before testing whether they are queued for quitting
        it("should return `2` for a ChatGroup with two queued to quit");
    });

});
