/**
 * The database wrapper for the user table
 * @author eLIPSE
 */

var tables = require('../../../config/db_tables.json');

var DatabaseWrapper = require("../DatabaseWrapper");

var tableName = tables.USERNAMES;



module.exports = new DatabaseWrapper(tableName);
