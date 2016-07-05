var url = require('url');

var redirects = {

  // Logs the user in
  login: function(uri) {
    return 'https://api.uqcloud.net/login/' + uri;
  },

  // Logs the user out
  logout: function(uri) {
    return 'https://api.uqcloud.net/logout/';
  }
};

module.exports = {
  redirects: redirects
};
