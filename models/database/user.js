/**
 * The database wrapper for the user table
 * @author elIPSE
 */

var tables = require('../../config/db_tables.json');

var db = {};

var user = {

  /**
   * Initialise the database object
   */
  init: function(database) {
    db = database;
  },

  create: function(data, callback){
    db[tables.USERNAMES].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback();
    });
  },

  read: function(query, callback) {
    db[tables.USERNAMES].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  readEach: function(query, callback) {
    db[tables.USERNAMES].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  update: function(query, data, callback) {
    db[tables.USERNAMES].update(query, data, function(err, res) {
      if (err) {
        console.log("Failed to update data: " + err);
      }
      if (callback) {
        callback(err, res);
      }
    });
  },

  delete: function(query, callback) {
    db[tables.USERNAMES].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback();
    });
  }
};

module.exports = user;
