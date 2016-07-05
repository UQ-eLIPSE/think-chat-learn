/**
 * Seeds the database with testing data, used for development
 */

var conf = require('../config/conf.json');
var db = require('../build/controllers/database.js');

function addNextUser(userData, count) {
  console.log("Adding user '" + userData[count].username + "'");
  db.user.create(userData[count], function() {
    if (count < userData.length - 1) {
      addNextUser(userData, count + 1);
    } else {
      var questionData = require('./data/uq-question.json');
      addNextQuestion(questionData, 0);
    }
  });
}

function addNextQuestion(questionData, count) {
  console.log("Adding question [" + (count + 1) + " / " + questionData.length + "]");
  db.question.create(questionData[count], function() {
    if (count < questionData.length - 1) {
      addNextQuestion(questionData, count + 1);
    } else {
      process.exit(0);
    }
  });

}

function addQuestionsToDB() {

  var userData = require('./data/users-test.json');

  var counter = 0;

  db.question.delete({}, function() {
    console.log("Wiped question database");
    addNextUser(userData, 0);
    });
}

addQuestionsToDB();
