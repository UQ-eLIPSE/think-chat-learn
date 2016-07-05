/**
 * The database wrapper for the question table
 * @author eLIPSE
 */

var tables = require('../../../config/db_tables.json');

var DatabaseWrapper = require("../DatabaseWrapper");

var tableName = tables.QUESTION;



module.exports = new DatabaseWrapper(tableName);
