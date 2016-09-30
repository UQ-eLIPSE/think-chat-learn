import * as mocha from "mocha";
import { assert } from "chai";

import { Utils } from "../js/Utils";

describe("/common/js/Utils", function() {

    describe("DateTime", function() {

        describe("secToMs", function() {

            it("should correctly convert seconds to milliseconds", function() {
                assert.strictEqual(Utils.DateTime.secToMs(0), 0);
                assert.strictEqual(Utils.DateTime.secToMs(5), 5000);
                assert.strictEqual(Utils.DateTime.secToMs(34), 34000);
                assert.strictEqual(Utils.DateTime.secToMs(-8), -8000);
            });

        });

        describe("minToMs", function() {

            it("should correctly convert minutes to milliseconds", function() {
                assert.strictEqual(Utils.DateTime.minToMs(0), 0);
                assert.strictEqual(Utils.DateTime.minToMs(5), 300000);
                assert.strictEqual(Utils.DateTime.minToMs(34), 2040000);
                assert.strictEqual(Utils.DateTime.minToMs(-8), -480000);
            });

        });

        describe("hrsToMs", function() {

            it("should correctly convert hours to milliseconds", function() {
                assert.strictEqual(Utils.DateTime.hrsToMs(0), 0);
                assert.strictEqual(Utils.DateTime.hrsToMs(5), 18000000);
                assert.strictEqual(Utils.DateTime.hrsToMs(34), 122400000);
                assert.strictEqual(Utils.DateTime.hrsToMs(-8), -28800000);
            });

        });

        describe("formatIntervalAsMMSS", function() {
            
            it("should format standard minute + second values correctly");

            it("should format minutes over 60 as is, and *not* in HH:MM:SS format");

            it("should format values with less than 60 seconds as 0:SS");

            it("should reject negative values");
            
        });

    });

});
