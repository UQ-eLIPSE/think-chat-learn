/**
 * Tests for /models/DatabaseWrapper
 */

"use strict";

const assert = require("chai").assert;

const DatabaseWrapper = require("../../models/DatabaseWrapper");


describe("/models/DatabaseWrapper", function() {

    describe("#constructor", function() {

        it("should store the table name correctly", function() {
            let tableName = "tableNameString";
            let dbWrapper = new DatabaseWrapper(tableName);

            assert.strictEqual(dbWrapper.tableName, tableName);
        });

    });

});
