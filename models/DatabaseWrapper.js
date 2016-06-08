/**
 * DatabaseWrapper
 * 
 * Base class for DB wrappers contained in /models/database.
 */

"use strict";

module.exports = class DatabaseWrapper {
    get table() {
        return this.db[this.tableName];
    }

    create(data, callback) {
        this.table.insert(data, function(err, res) {
            if (err) {
                console.log("Failed to save data: " + err);
            }
            callback(err, res);
        });
    }

    read(query, callback) {
        this.table.find(query, function(err, res) {
            if (err) {
                console.log("Failed to read data: " + err);
            }
            callback(err, res);
        });
    }
    
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

    delete(query, callback) {
        this.table.remove(query, function(err, res) {
            if (err) {
                console.log("Failed to delete data: " + err);
            }
            callback(err, res);
        });
    }
    
    init(database) {
        this.db = database;
    }
    
    constructor(tableName) {
        this.tableName = tableName;
    }
}