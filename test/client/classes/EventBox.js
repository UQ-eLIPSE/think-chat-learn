/**
 * Tests for client/classes/EventBox
 */

"use strict";

var assert = require("chai").assert;

// RequireJS required for client-side code as it is compiled to AMD format
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + "/../../../public/js/moocchat2",
    nodeRequire: require
});

// Import client-side code using *requirejs*
var EventBox = requirejs("classes/EventBox").EventBox;

describe("client/classes/EventBox", function() {
    describe("#constructor", function() {
        it("should return object which is an instance of EventBox", function() {
            var eventBoxInstance = new EventBox();

            assert.isTrue(eventBoxInstance instanceof EventBox);
        });
    });

    describe("#on", function() {
        it("should attach event callback", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";
            var eventSetValue = 0;

            eventBoxInstance.on(eventName, function() {
                eventSetValue = 1;
            });

            eventBoxInstance.dispatch(eventName);

            assert.strictEqual(eventSetValue, 1);
        });

        it("should only attach callback for given event, not for other events", function() {
            var eventBoxInstance = new EventBox();
            var eventName1 = "testEvent1";
            var eventName2 = "testEvent2";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            eventBoxInstance.on(eventName1, function() {
                eventSetValue1 = 1;
            });

            eventBoxInstance.on(eventName2, function() {
                eventSetValue2 = 2;
            });

            eventBoxInstance.dispatch(eventName1);

            assert.strictEqual(eventSetValue1, 1);
            assert.strictEqual(eventSetValue2, 0);
        });

        it("should attach event callback and trigger it when event dispatched previously", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";
            var eventSetValue = 0;

            eventBoxInstance.dispatch(eventName);

            eventBoxInstance.on(eventName, function() {
                eventSetValue = 1;
            });

            assert.strictEqual(eventSetValue, 1);
        });

        it("should not trigger event callback on attach when set so", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";
            var eventSetValue = 0;

            eventBoxInstance.dispatch(eventName);

            eventBoxInstance.on(eventName, function() {
                eventSetValue = 1;
            }, false);

            assert.strictEqual(eventSetValue, 0);
        });

        it("should attach two separate callbacks to the same event", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            eventBoxInstance.on(eventName, function() {
                eventSetValue1 = 1;
            });

            eventBoxInstance.on(eventName, function() {
                eventSetValue2 = 2;
            });

            eventBoxInstance.dispatch(eventName);

            assert.strictEqual(eventSetValue1, 1);
            assert.strictEqual(eventSetValue2, 2);
        });
    });

    describe("#off", function() {
        it("should detach all event callbacks for given event", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            eventBoxInstance.on(eventName, function() {
                eventSetValue1 = 1;
            });

            eventBoxInstance.on(eventName, function() {
                eventSetValue2 = 2;
            });

            eventBoxInstance.off(eventName);
            eventBoxInstance.dispatch(eventName);

            assert.strictEqual(eventSetValue1, 0);
            assert.strictEqual(eventSetValue2, 0);
        });

        it("should detach given event callback for given event", function() {
            var eventBoxInstance = new EventBox();
            var eventName = "testEvent";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            var callback1 = function() {
                eventSetValue1 = 1;
            }

            var callback2 = function() {
                eventSetValue2 = 2;
            }

            eventBoxInstance.on(eventName, callback1);
            eventBoxInstance.on(eventName, callback2);

            eventBoxInstance.off(eventName, callback1);

            eventBoxInstance.dispatch(eventName);

            assert.strictEqual(eventSetValue1, 0);
            assert.strictEqual(eventSetValue2, 2);
        });

        it("should only detach callbacks for given event, not for other events", function() {
            var eventBoxInstance = new EventBox();
            var eventName1 = "testEvent1";
            var eventName2 = "testEvent2";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            eventBoxInstance.on(eventName1, function() {
                eventSetValue1 = 1;
            });

            eventBoxInstance.on(eventName2, function() {
                eventSetValue2 = 2;
            });

            eventBoxInstance.off(eventName1);

            eventBoxInstance.dispatch(eventName1);
            eventBoxInstance.dispatch(eventName2);

            assert.strictEqual(eventSetValue1, 0);
            assert.strictEqual(eventSetValue2, 2);
        });
    });

    describe("#destroy", function() {
        it("should clear all callbacks", function() {
            var eventBoxInstance = new EventBox();
            var eventName1 = "testEvent1";
            var eventName2 = "testEvent2";

            var eventSetValue1 = 0;
            var eventSetValue2 = 0;

            eventBoxInstance.on(eventName1, function() {
                eventSetValue1 = 1;
            });

            eventBoxInstance.on(eventName2, function() {
                eventSetValue2 = 2;
            });

            eventBoxInstance.destroy();

            eventBoxInstance.dispatch(eventName1);
            eventBoxInstance.dispatch(eventName2);

            assert.strictEqual(eventSetValue1, 0);
            assert.strictEqual(eventSetValue2, 0);
        });
    });
});
