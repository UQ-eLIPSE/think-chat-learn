/**
 * The database wrapper for the userquiz table
 * @author eLIPSE
 */

var tables = require('../../config/db_tables.json');

var DatabaseWrapper = require("../DatabaseWrapper");

var tableName = tables.USERQUIZ;



module.exports = new DatabaseWrapper(tableName);