/**
 * Session
 * 
 */

"use strict";

var Client = require("./client");

/**
 * @param {Client} client
 */
var Session = function(client, quizScheduleSession) {
    this.id = require('crypto').randomBytes(16).toString('hex');    // {string}
    this.client = client;
    this.hasElevatedPermissions = false;

    this.quizSession = quizScheduleSession;
    this.quizQuestion;
    this.quizQuestionOptions;
}

/**
 * @param {boolean} value
 */
Session.prototype.setElevatedPermissions = function(value) {
    this.hasElevatedPermissions = value;
}

/**
 * @param {IDB_Question} question
 */
Session.prototype.setQuizQuestion = function(question) {
    this.quizQuestion = question;
}

/**
 * @param {IDB_QuestionOption[]} questionOptions
 */
Session.prototype.setQuizQuestionOptions = function(questionOptions) {
    this.quizQuestionOptions = questionOptions;
}

module.exports = Session;