/**
 * Seeds the database with testing data, used for development
 */

var Conf = require("../../build/server/config/Conf").Conf;
var Database = require("../../build/server/js/data/Database").Database;

var Question = require("../../build/server/js/data/models/Question").Question;
var QuestionOption = require("../../build/server/js/data/models/QuestionOption").QuestionOption;
var QuestionOptionCorrect = require("../../build/server/js/data/models/QuestionOptionCorrect").QuestionOptionCorrect;
var QuizSchedule = require("../../build/server/js/data/models/QuizSchedule").QuizSchedule;
var Survey = require("../../build/server/js/data/models/Survey").Survey;

var dataFolder = "./data";

// Connect to DB and set up data classes
Database.Connect(Conf.database, function(err, db) {
    if (err) {
        return console.error(err.message);
    }

    var dbQuestion = new Question(db);
    var dbQuestionOption = new QuestionOption(db);
    var dbQuestionOptionCorrect = new QuestionOptionCorrect(db);
    var dbQuizSchedule = new QuizSchedule(db);
    var dbSurvey = new Survey(db);

    // Data to insert
    var questionData = require(dataFolder + "/uq_question")(Database);
    var questionOptionData = require(dataFolder + "/uq_questionOption")(Database);
    var questionOptionCorrectData = require(dataFolder + "/uq_questionOptionCorrect")(Database);
    var quizScheduleData = require(dataFolder + "/uq_quizSchedule")(Database);
    var surveyData = require(dataFolder + "/uq_survey")(Database);

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
        Database.Close(db);

        // Process exit occurs only after a short while so that queued stdout appear
        setTimeout(function() {
            process.exit(0);
        }, 500);
    });


    // Clear collections/tables then insert
    db.dropDatabase(function() {
        console.log("Dropped database\n==========");



        var createdQuestion = doneFactory(questionData.length, function() {
            console.log("Questions inserted");
            done();
        });

        questionData.forEach(function(data) {
            dbQuestion.insertOne(data, function() {
                createdQuestion();
            });
        });



        var createdQuestionOption = doneFactory(questionOptionData.length, function() {
            console.log("Question options inserted");
            done();
        });

        questionOptionData.forEach(function(data) {
            dbQuestionOption.insertOne(data, function() {
                createdQuestionOption();
            });
        });



        var createdQuestionOptionCorrect = doneFactory(questionOptionCorrectData.length, function() {
            console.log("Question option correct justifications inserted");
            done();
        });

        questionOptionCorrectData.forEach(function(data) {
            dbQuestionOptionCorrect.insertOne(data, function() {
                createdQuestionOptionCorrect();
            });
        });



        var createdQuizSchedule = doneFactory(quizScheduleData.length, function() {
            console.log("Quiz schedules inserted");
            done();
        });

        quizScheduleData.forEach(function(data) {
            dbQuizSchedule.insertOne(data, function() {
                createdQuizSchedule();
            });
        });



        var createdSurvey = doneFactory(surveyData.length, function() {
            console.log("Surveys inserted");
            done();
        });

        surveyData.forEach(function(data) {
            dbSurvey.insertOne(data, function() {
                createdSurvey();
            });
        });
    });
});