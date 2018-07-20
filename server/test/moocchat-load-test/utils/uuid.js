/**
 * Generates unique id
 * Utility taken from StackOverflow
 * https://stackoverflow.com/a/2117523
 * Note: This utility is for testing purposes only. Please consult the source (link) before (re)using it in production.
 */

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }


module.exports = uuidv4;
