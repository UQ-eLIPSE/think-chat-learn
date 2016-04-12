/**
 * Handles all writing and reading to the database
 * @author eLIPSE
 */
var conf = require('../config/conf.json');

// The new way to get table names
var tables = require('../config/db_tables.json');

var collection_suffixes = [
  "userLogin",
  "userQuiz",
  "quizRoom",
  "discussionRoom",
  "survey",
  "bonusRecipient",
  "question",
  "userConsent",
  "postSurvey",
  "usernames",
	"userFlow"
];

// The old way of doing it (kept in for existing code)
var collections = [];

for (var suffix in collection_suffixes) {
  collections.push(conf.collectionPrefix + collection_suffixes[suffix]);
}

// Set to an object
var mongojs = require("mongojs");
var db = mongojs(conf.database, collections);

// Import the database models
var question = require('../models/database/question');
question.init(db);
var userquiz = require('../models/database/userquiz');
userquiz.init(db);
var userflow = require('../models/database/userflow');
userflow.init(db);
var user = require('../models/database/user');
user.init(db);

module.exports = {
  collections: collections,
  db: db,
  question: question,
  userflow: userflow,
  userquiz: userquiz,
  user: user,
  tables: tables
};
