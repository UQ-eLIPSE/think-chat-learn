

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

var collections = [];

for (var suffix in collection_suffixes) {
  collections.push(global.conf.collectionPrefix + collection_suffixes[suffix]);
}

// Set to an object
var mongojs = require("mongojs");
var db = mongojs(global.conf.database, collections);

module.exports = {
  collections: collections,
  db: db
};
