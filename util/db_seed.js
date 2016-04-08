/**
 * Seeds the database with testing data, used for development
 */

var conf = require('../config/conf.json');
var db = require('../controllers/database.js');


function addQuestionsToDB() {
  var questionData = require('./data/uq-question.json');

  // Clear question database
  //db.question.delete({});
  console.log("Wiped question database");

  for (var i in questionData) {
    db.question.create(questionData[i]);
    console.log("Added question " + i + " to database");
  }

  console.log("Finished adding questions");
}

addQuestionsToDB();

process.exit();
