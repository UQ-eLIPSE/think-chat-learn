/**
 * The database wrapper for the question table
 * @author elIPSE
 */

var tables = require('../../config/db_tables.json');

var db = {};

var question = {

  /**
   * Initialise the database object
   */
  init: function(database) {
    db = database;
  },
  
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

module.exports = question;
