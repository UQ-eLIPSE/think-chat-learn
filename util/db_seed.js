/**
 * Seeds the database with testing data, used for development
 */

var db = require("../build/server/js/controllers/database");
var mongojs = require("mongojs");

var dataFolder = "./data";

// Data to insert
var questionData = require(dataFolder + "/uq_question")(mongojs);
var questionOptionData = require(dataFolder + "/uq_questionOption")(mongojs);
var questionOptionCorrectData = require(dataFolder + "/uq_questionOptionCorrect")(mongojs);
var quizScheduleData = require(dataFolder + "/uq_quizSchedule")(mongojs);
var surveyData = require(dataFolder + "/uq_survey")(mongojs);

/**
 * Generates function that counts executions to synchronise provided callback
 * 
 * @param {number} count
 * @param {Function} callback
 * 
 * @return {Function}
 */
function doneFactory(count, callback) {
    return function() {
        if (--count === 0) {
            callback();
        }
    }
}


// Done counter function for all tables
var done = doneFactory(5, function() {
    console.log("==========\nDatabase seed finished");

    // Process exit occurs only after a short while so that queued stdout appear
    setTimeout(function() {
        process.exit(0);
    }, 500);
});


// Clear collections/tables then insert
db.database.dropDatabase(function() {
    console.log("Dropped database\n==========");



    var createdQuestion = doneFactory(questionData.length, function() {
        console.log("Questions inserted");
        done();
    });

    questionData.forEach(function(data) {
        db.question.create(data, function() {
            createdQuestion();
        });
    });



    var createdQuestionOption = doneFactory(questionOptionData.length, function() {
        console.log("Question options inserted");
        done();
    });

    questionOptionData.forEach(function(data) {
        db.questionOption.create(data, function() {
            createdQuestionOption();
        });
    });



    var createdQuestionOptionCorrect = doneFactory(questionOptionCorrectData.length, function() {
        console.log("Question option correct justifications inserted");
        done();
    });

    questionOptionCorrectData.forEach(function(data) {
        db.questionOptionCorrect.create(data, function() {
            createdQuestionOptionCorrect();
        });
    });



    var createdQuizSchedule = doneFactory(quizScheduleData.length, function() {
        console.log("Quiz schedules inserted");
        done();
    });

    quizScheduleData.forEach(function(data) {
        db.quizSchedule.create(data, function() {
            createdQuizSchedule();
        });
    });



    var createdSurvey = doneFactory(surveyData.length, function() {
        console.log("Surveys inserted");
        done();
    });

    surveyData.forEach(function(data) {
        db.survey.create(data, function() {
            createdSurvey();
        });
    });
});