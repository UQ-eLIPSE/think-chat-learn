/**
 * The database wrapper for the userflow table
 * @author eLIPSE
 */

var tables = require('../../../config/db_tables.json');

var DatabaseWrapper = require("../DatabaseWrapper");

var tableName = tables.USERFLOW;



module.exports = new DatabaseWrapper(tableName);