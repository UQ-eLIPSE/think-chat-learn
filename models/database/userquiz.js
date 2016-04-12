/**
 * The database wrapper for the userquiz table
 * @author elIPSE
 */

var tables = require('../../config/db_tables.json');

var db = {};

var userquiz = {

  /**
   * Initialise the database object
   */
  init: function(database) {
    db = database;
  },

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

module.exports = userquiz;
