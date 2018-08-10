"use strict";

const io = require('socket.io-client');
const log = require("../utils/log");
const EventEmitter = require('events');

/** A class to simulate the mocchat client */
class Client extends EventEmitter {

    constructor(userData, connectionId) {
        super();
        this.connectionId = connectionId;
        this.userData = userData;
        this.seq = 0;
        this.sessionId = null;
        this.quizAttemptId = null;
        this.survey = null;
        this.username = null;
        this.quizAttemptId = null
        this.researchConsentRequired = false;
        this.quiz = null;
        this.clientIndex = null;
        this.groupId = null;

        // STATE
        this.loggedIn = false;
        this.answerSavedOnServer = false;

    }

    initSocket(url) {

        this.socket = io.connect(url, {
            // Permit infinite reconnects
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1500,
            reconnectionDelayMax: 2000,

            transports: ["websocket"]
        });

        this.socket.on('error', (error) => {
            this.log(error)
        });

        this.socket.on('connect', () => {
            this.log('Connected socket');
            this.socket.emit("PacSeq::DAT", { seq: this.seq++, event: 'loginLti', data: this.userData });
        });

        this.socket.on('disconnect', () => {
            this.log('Socket disconnected connection');
        });

        this.socket.on('reconnecting', () => {
            this.log('Reconnecting . . .');
        })

        this.socket.on("PacSeq::DAT", (response) => {
            let ack = false;
            switch (response.event) {
                case "loginSuccess": {
                    if (response.data) ack = true;
                    this.sessionId = response.data.sessionId;
                    this.quiz = response.data.quiz;
                    this.researchConsentRequired = response.data.researchConsentRequired;
                    this.survey = response.data.survey;
                    this.quizAttemptId = response.data.quizAttemptId;
                    this.loggedIn = true;
                    this.log('Logged In ');
                    this.acknowledge(ack, response.seq);
                    if (ack) this.sendInitialSubmission();
                    break;
                }
                case "answerSubmissionInitialSaved": {
                    this.log('Answer submission saved');
                    this.answerSavedOnServer = true;
                    ack = true;
                    this.acknowledge(ack, response.seq);
                    if (ack) this.sendChatGroupJoinRequest();
                    break;
                }

                case "chatGroupFormed": {
                    this.log('Chat group formed');
                    if (response.data) ack = true;
                    this.clientIndex = response.data.clientIndex;
                    this.groupId = response.data.groupId;
                    this.log('Group Id : ' + response.data.groupId);
                    this.acknowledge(ack, response.seq);
                    if (ack) {
                        this.emit('addedToChatGroup', this.connectionId);
                    }
                }

            }


        });

        this.socket.on("PacSeq::ACK", (data) => {
            this.log('Acknowledged, ' + JSON.stringify(data));
        });

    }

    acknowledge(ack, seq) {
        if (ack === true) {
            this.socket.emit("PacSeq::ACK", { ack: seq });
        }
    }

    sendInitialSubmission() {
        this.log('Sending Initial Submission');
        this.socket.emit("PacSeq::DAT", {
            seq: this.seq++,
            event: "answerSubmissionInitial",
            data: {
                quizAttemptId: this.quizAttemptId,
                justification: this.getJustification(),
                optionId: null
            }
        });
    }

    sendChatGroupJoinRequest() {
        this.log('Sending chat group join request');
        this.socket.emit("PacSeq::DAT", {
            seq: this.seq++,
            event: "chatGroupJoinRequest",
            data: {
                quizAttemptId: this.quizAttemptId
            }
        });
    }

    getJustification() {
        const justifications = ["This is the answer because X", 'I think that Y should be the answer', "Z is the answer", ""];
        return justifications[Math.floor(Math.random() * 4)];
    }

    log(message) {
        log(this.connectionId, message);
    }
}

module.exports = Client;