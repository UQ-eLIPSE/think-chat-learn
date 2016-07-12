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
    this.id = null;     // {String}

    // this.hasElevatedPermissions = false;

    this.quizSession = quizScheduleSession;
    this.quizQuestion;
    this.quizQuestionOptions;

    this.responseInitial = {
        _id: null,
        optionId: null,
        justification: null
    };

    this.responseFinal = {
        _id: null,
        optionId: null,
        justification: null
    };
    
    // Set back reference to session in Client
    this.client = client;
    client.setSession(this);
}

/**
 * @param {boolean} value
 */
// Session.prototype.setElevatedPermissions = function(value) {
//     this.hasElevatedPermissions = value;
// }

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

/**
 * Sets ID. Settable once only.
 * 
 * @param {string} id
 */
Session.prototype.setId = function(id) {
    if (this.id) {
        return;
    }

    this.id = id;
}

Session.prototype.getId = function() {
    return this.id;
}

module.exports = Session;