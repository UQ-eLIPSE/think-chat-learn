/**
 * The database wrapper for the userquiz table
 * @author elIPSE
 */

var tables = require('../../config/db_tables.json');

var db = {};

var quizroom = {

  /**
   * Initialise the database object
   */
  init: function(database) {
    db = database;
  },

  create: function(data, callback){
    db[tables.QUIZROOM].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  read: function(query, callback) {
    db[tables.QUIZROOM].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  update: function(query, data, callback) {
    db[tables.QUIZROOM].update(query, data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      if (callback) {
        callback(err, res);
      }

    });
  },

  delete: function(query, callback) {
    db[tables.QUIZROOM].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback(err, res);
    });
  }
};

module.exports = quizroom;
