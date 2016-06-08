"use strict";

/**
 * DatabaseWrapper
 * 
 * Base class for DB wrappers contained in /models/database.
 */
class DatabaseWrapper {
    get table() {
        return this.db[this.tableName];
    }

    /**
     * @param {Object} data
     * @param {Function} callback
     */
    create(data, callback) {
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
    read(query, callback) {
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
    readEach(query, callback) {
        this.table.find(query, function(err, res) {
            if (err) {
                console.log("Failed to read data: " + err);
            }

            for (let i = 0; i < res.length; i++) {
                callback(err, res[i]);
            }
        });
    }
  
    /**
     * @param {Object} query
     * @param {Object} data
     * @param {Function} callback
     */
    update(query, data, callback) {
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
    delete(query, callback) {
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
    init(database) {
        this.db = database;
    }
    
    constructor(tableName) {
        this.tableName = tableName;
    }
}

module.exports = DatabaseWrapper;