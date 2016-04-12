/**
 * Handles all writing and reading to the database
 * @author eLIPSE
 */
var conf = require('../config/conf.json');

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

// The new way to do it
var tables = {};

for (var suffix in collection_suffixes) {
  collections.push(conf.collectionPrefix + collection_suffixes[suffix]);
  tables[collection_suffixes[suffix].toUpperCase()] = conf.collectionPrefix + collection_suffixes[suffix];
}

// Set to an object
var mongojs = require("mongojs");
var db = mongojs(conf.database, collections);

// TODO: In the future extract this to a separate file
var question = {
  create: function(data, callback){
    db[tables.QUESTION].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback();
    });
  },

  read: function(query, callback) {
    db[tables.QUESTION].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  update: function(query, data, callback) {

  },

  delete: function(query, callback) {
    db[tables.QUESTION].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback();
    });
  }
};

var userquiz = {
  create: function(data, callback){
    db[tables.USERQUIZ].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback();
    });
  },

  read: function(query) {

  },

  update: function(query, data, callback) {
    db[tables.USERQUIZ].update(query, data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      if (callback) {
        callback(err, res);
      }

    });
  },

  delete: function(query, callback) {
    db[tables.USERQUIZ].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback();
    });
  }
};

var userflow = {
  create: function(data, callback){
    db[tables.USERFLOW].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback();
    });
  },

  read: function(query, callback) {
    db[tables.USERFLOW].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  update: function(query, data, callback) {
    db[tables.USERFLOW].update(query, data, function(err, res) {
      if (err) {
        console.log("Failed to update data: " + err);
      }
      if (callback) {
        callback(err, res);
      }
    });
  },

  delete: function(query, callback) {
    db[tables.USERFLOW].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback();
    });
  }
};

module.exports = {
  collections: collections,
  db: db,
  question: question,
  userflow: userflow,
  userquiz: userquiz,
  tables: tables
};
