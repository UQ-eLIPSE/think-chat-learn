import * as mocha from "mocha";
import {assert} from "chai";

import {Conf} from "../../../config/Conf";


describe("server/js/classes/conf/Conf with root server configuration file", function() {

    describe("Configurations", function() {

        describe("portNum", function() {

            it("config property should exist", function() {
                assert.property(Conf, "portNum");
            });

            it("value should be of type `number`", function() {
                assert.typeOf(Conf.portNum, "number");
            });

        });

        describe("database", function() {

            it("config property should exist", function() {
                assert.property(Conf, "database");
            });

            it("value should be of type `string`", function() {
                assert.typeOf(Conf.database, "string");
            });

        });

        describe("http", function() {

            it("config property should exist", function() {
                assert.property(Conf, "http");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.http, "maxSockets");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.http.maxSockets, "number");
            });

        });

        describe("socketIo", function() {

            it("config property should exist", function() {
                assert.property(Conf, "socketIo");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.socketIo, "pingInterval");
                assert.property(Conf.socketIo, "pingTimeout");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.socketIo.pingInterval, "number");
                assert.typeOf(Conf.socketIo.pingTimeout, "number");
            });

        });

        describe("express", function() {

            it("config property should exist", function() {
                assert.property(Conf, "express");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.express, "serveStaticContent");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.express.serveStaticContent, "boolean");
            });

        });

        describe("lti", function() {

            it("config property should exist", function() {
                assert.property(Conf, "lti");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.lti, "testMode");
                assert.property(Conf.lti, "signingInfo");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.lti.testMode, "boolean");
                assert.typeOf(Conf.lti.signingInfo, "object");
            });



            describe("signingInfo", function() {

                it("all required sub-configs should exist", function() {
                    assert.property(Conf.lti.signingInfo, "method");
                    assert.property(Conf.lti.signingInfo, "url");
                    assert.property(Conf.lti.signingInfo, "consumer");
                });

                it("all sub-configs should be of valid type", function() {
                    assert.typeOf(Conf.lti.signingInfo.method, "string");
                    assert.typeOf(Conf.lti.signingInfo.url, "string");
                    assert.typeOf(Conf.lti.signingInfo.consumer, "object");
                });



                describe("consumer", function() {

                    it("all required sub-configs should exist", function() {
                        assert.property(Conf.lti.signingInfo.consumer, "key");
                        assert.property(Conf.lti.signingInfo.consumer, "secret");
                    });

                    it("all sub-configs should be of valid type", function() {
                        assert.typeOf(Conf.lti.signingInfo.consumer.key, "string");
                        assert.typeOf(Conf.lti.signingInfo.consumer.secret, "string");
                    });

                });

            });

        });

        describe("piwik", function() {

            it("config property should exist", function() {
                assert.property(Conf, "piwik");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.piwik, "url");
                assert.property(Conf.piwik, "siteId");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.piwik.url, "string");
                assert.typeOf(Conf.piwik.siteId, "number");
            });

        });

        describe("chat", function() {

            it("config property should exist", function() {
                assert.property(Conf, "chat");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.chat, "groups");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.chat.groups, "object");
            });

            describe("groups", function() {

                it("all required sub-configs should exist", function() {
                    assert.property(Conf.chat.groups, "desiredSize");
                    assert.property(Conf.chat.groups, "formationIntervalMs");
                    assert.property(Conf.chat.groups, "formationTimeoutMs");
                });

                it("all sub-configs should be of valid type", function() {
                    assert.typeOf(Conf.chat.groups.desiredSize, "number");
                    assert.typeOf(Conf.chat.groups.formationIntervalMs, "number");
                    assert.typeOf(Conf.chat.groups.formationTimeoutMs, "number");
                });
            });
        });

        describe("backupClient", function() {

            it("config property should exist", function() {
                assert.property(Conf, "backupClient");
            });

            it("all required sub-configs should exist", function() {
                assert.property(Conf.backupClient, "callConfirmTimeoutMs");
            });

            it("all sub-configs should be of valid type", function() {
                assert.typeOf(Conf.backupClient.callConfirmTimeoutMs, "number");
            });

        });
    });
});
