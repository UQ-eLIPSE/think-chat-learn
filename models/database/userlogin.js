/**
 * The database wrapper for the userlogin table
 * @author elIPSE
 */

var tables = require('../../config/db_tables.json');

var db = {};

var userlogin = {

  /**
   * Initialise the database object
   */
  init: function(database) {
    db = database;
  },

  create: function(data, callback){
    db[tables.USERLOGIN].insert(data, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback();
    });
  },

  read: function(query, callback) {
    db[tables.USERLOGIN].find(query, function(err, res) {
      if (err) {
        console.log("Failed to save data: " + err);
      }
      callback(err, res);
    });
  },

  update: function(query, data, callback) {
    db[tables.USERLOGIN].update(query, data, function(err, res) {
      if (err) {
        console.log("Failed to update data: " + err);
      }
      if (callback) {
        callback(err, res);
      }
    });
  },

  delete: function(query, callback) {
    db[tables.USERLOGIN].remove(query, function(err, res) {
      if (err) {
        console.log("Failed to delete data: " + err);
      }
      callback();
    });
  }
};

module.exports = userlogin;
