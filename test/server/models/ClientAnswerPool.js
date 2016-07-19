/**
 * Tests for /models/ClientAnswerPool
 */

"use strict";

var assert = require("chai").assert;

var ClientAnswerPool = require("../../../build/models/ClientAnswerPool");


describe("server/models/ClientAnswerPool", function() {
    // TODO: Write tests for ClientAnswerPool.
    
    // Currently held back because quiz object not well defined,
    // which means that the constructor can't have meaningful
    // tests run against it

    describe("#constructor", function() {
        it("should have a number of answer keys matching that of the given quiz answers");
        it("should have empty queues for a new pool");
    });
    
});
