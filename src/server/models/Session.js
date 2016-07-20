/**
 * Session
 * 
 */

"use strict";

var Client = require("./client");

/**
 * @param {Client} client
 * @param {IDB_QuizSchedule} quizScheduleSession
 */
var Session = function(client, quizScheduleSession) {
    this.id = null;     // {String}

    this.quizSchedule = quizScheduleSession;
    this.quizQuestion;
    this.quizQuestionOptions;

    this.survey;

    // `responseInitial` and `responseFinal` hold the answers as received from client
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
 * @param {IDB_Survey} survey
 */
Session.prototype.setSurvey = function(survey) {
    this.survey = survey;
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

/**
 * Gets session ID.
 * 
 * @return {string}
 */
Session.prototype.getId = function() {
    return this.id;
}

/**
 * Gets the quiz schedule ID, as a string.
 * 
 * @return {string}
 */
Session.prototype.getQuizScheduleIdString = function() {
    return this.quizSchedule._id.toString();
}

module.exports = Session;