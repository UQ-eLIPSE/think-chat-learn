/**
 * Tests for /models/DatabaseWrapper
 */

"use strict";

var assert = require("chai").assert;

var DatabaseWrapper = require("../../build/models/DatabaseWrapper").DatabaseWrapper;


describe("/models/DatabaseWrapper", function() {

    describe("#constructor", function() {

        it("should store the table name correctly", function() {
            var tableName = "tableNameString";
            var dbWrapper = new DatabaseWrapper(tableName);

            assert.strictEqual(dbWrapper.tableName, tableName);
        });

    });

});
