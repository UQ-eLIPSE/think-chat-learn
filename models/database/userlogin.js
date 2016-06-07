/**
 * The database wrapper for the userlogin table
 * @author eLIPSE
 */

var tables = require('../../config/db_tables.json');

var DatabaseWrapper = require("../DatabaseWrapper");

var tableName = tables.USERLOGIN;



module.exports = new DatabaseWrapper(tableName);
