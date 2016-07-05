"use strict";

/**
 * DatabaseWrapper
 * 
 * Base class for DB wrappers contained in /models/database.
 */
var DatabaseWrapper = function(tableName) {
    this.tableName = tableName;
}

Object.defineProperty(DatabaseWrapper.prototype, "table", {
    get: function() {
        return this.db[this.tableName];
    }
});

/**
 * @param {Object} data
 * @param {Function} callback
 */
DatabaseWrapper.prototype.create = function(data, callback) {
    this.table.insert(data, function(err, res) {
        if (err) {
            console.log("Failed to save data: " + err);
        }
        callback(err, res);
    });
}

/**
 * @param {Object} data
 * @param {Function} callback
 */
DatabaseWrapper.prototype.read = function(query, callback) {
    this.table.find(query, function(err, res) {
        if (err) {
            console.log("Failed to read data: " + err);
        }
        callback(err, res);
    });
}

/**
 * @param {Object} data
 * @param {Function} callback
 */
DatabaseWrapper.prototype.readEach = function(query, callback) {
    this.table.find(query, function(err, res) {
        if (err) {
            console.log("Failed to read data: " + err);
        }

        for (var i = 0; i < res.length; i++) {
            callback(err, res[i]);
        }
    });
}

/**
 * @param {Object} query
 * @param {Object} data
 * @param {Function} callback
 */
DatabaseWrapper.prototype.update = function(query, data, callback) {
    this.table.update(query, data, function(err, res) {
        if (err) {
            console.log("Failed to update data: " + err);
        }
        if (callback) {
            callback(err, res);
        }
    });
}

/**
 * @param {Object} data
 * @param {Function} callback
 */
DatabaseWrapper.prototype.delete = function(query, callback) {
    this.table.remove(query, function(err, res) {
        if (err) {
            console.log("Failed to delete data: " + err);
        }
        callback(err, res);
    });
}

/**
 * Connects the wrapper to the database.
 * 
 * **Must be run before anything can be done to the tables.**
 */
DatabaseWrapper.prototype.init = function(database) {
    this.db = database;
}


module.exports = DatabaseWrapper;