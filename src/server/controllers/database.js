/**
 * Handles all writing and reading to the database
 * @author eLIPSE
 */
var conf = require('../../config/conf.json');

var collections = [];
var tables = require("../models/database/Tables").tables;

for (var key in tables) {
	collections.push(tables[key]);
}

// Set to an object
var mongojs = require("mongojs");
var db = mongojs(conf.database, collections);

// Import the database models
var Question = require("../models/database/Question").Question;
var QuestionOption = require("../models/database/QuestionOption").QuestionOption;
var QuestionOptionCorrect = require("../models/database/QuestionOptionCorrect").QuestionOptionCorrect;
var QuestionResponse = require("../models/database/QuestionResponse").QuestionResponse;

var QuizSchedule = require("../models/database/QuizSchedule").QuizSchedule;

var ChatMessage = require("../models/database/ChatMessage").ChatMessage;

var User = require("../models/database/User").User;
var UserSession = require("../models/database/UserSession").UserSession;

var Survey = require("../models/database/Survey").Survey;
var SurveyResponse = require("../models/database/SurveyResponse").SurveyResponse;

module.exports = {
	// ORM objects
	question: new Question(db),
	questionOption: new QuestionOption(db),
	questionOptionCorrect: new QuestionOptionCorrect(db),
	questionResponse: new QuestionResponse(db),

	quizSchedule: new QuizSchedule(db),

	chatMessage: new ChatMessage(db),

	user: new User(db),
	userSession: new UserSession(db),

	survey: new Survey(db),
	surveyResponse: new SurveyResponse(db)
};
