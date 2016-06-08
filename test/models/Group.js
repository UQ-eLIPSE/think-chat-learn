/**
 * Tests for /models/Group
 */

"use strict";

const assert = require("chai").assert;

const io = global.io;
const Client = require("../../models/client");
const Group = require("../../models/Group");


describe("/models/Group", function() {

    describe("#constructor", function() {
        var group1 = new Group();
        var group2 = new Group();

        it("should create Groups which have non identical IDs", function() {
            assert.notStrictEqual(group1.id, group2.id);
        });
    });

    describe("#getNumberOfClients", function() {
        let newBlankGroup = new Group();

        it("should return `0` for a new Group", function() {
            assert.strictEqual(newBlankGroup.clients.length, newBlankGroup.numberOfClients());
            assert.strictEqual(newBlankGroup.numberOfClients(), 0);
        });


        let newGroup2 = new Group();
        newGroup2.clients = [new Client(), new Client()];

        it("should return `2` for a Group with two clients", function() {
            assert.strictEqual(newBlankGroup.clients.length, newBlankGroup.numberOfClients());
            assert.strictEqual(newGroup2.numberOfClients(), 2);
        });
    });

    // TODO: Group requires clients to have an active socket
    // before they can be added
      
    describe("#addClient", function() {
        let clientA = new Client();
        // let clientB = new Client();

        it("should add a client to a Group"/*, function() {
            let newGroup = new Group([]);

            assert.strictEqual(newGroup.numberOfClients(), 0);

            newGroup.addClient(clientA);

            assert.strictEqual(newGroup.numberOfClients(), 1);
        }*/);

        it("should not add the same client again"/*, function() {
            let newGroup = new Group([]);

            assert.strictEqual(newGroup.numberOfClients(), 0);

            newGroup.addClient(clientA);
            newGroup.addClient(clientA);

            assert.strictEqual(newGroup.numberOfClients(), 1);
        }*/);
    });

    describe("#addClients", function() {
        let clientA = new Client();
        let clientB = new Client();

        it("should add no clients when given empty array", function() {
            let newGroup = new Group([]);

            newGroup.addClients([]);

            assert.strictEqual(newGroup.numberOfClients(), 0);
        });

        it("should add 2 clients when given two unique ones"/*, function() {
            let newGroup = new Group([]);
            
            newGroup.addClients([clientA, clientB]);

            assert.strictEqual(newGroup.numberOfClients(), 2);
        }*/);
        
        it("should add 1 client when given two identical ones"/*, function() {
            let newGroup = new Group([]);
            
            newGroup.addClients([clientA, clientA]);

            assert.strictEqual(newGroup.numberOfClients(), 1);
        }*/);
    });

});
