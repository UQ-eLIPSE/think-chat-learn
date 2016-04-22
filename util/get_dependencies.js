/**
 * Downloads all required JS and CSS dependencies
 * @author eLIPSE
 */

var http = require('http');
var fs = require('fs');

// Add more dependencies here to download
var dependencies = [
  'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',
  'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js',
  'http://code.jquery.com/jquery-2.2.3.min.js',
  'http://cdn.socket.io/socket.io-1.4.5.js'
];

/**
 * Saves a file to the public folder for serving
 * @param url The url
 */
function saveFile(url) {
  var urlItems = url.split('/');
  var filename = urlItems[urlItems.length - 1];
  var nameSplit = filename.split('.');
  var filetype = nameSplit[nameSplit.length - 1];

  var file = null;
  if (filetype == 'js') {
    // If its a javascript file, save it to the js folder
    file = fs.createWriteStream('public/js/' + filename);
    console.log("Saving '" + filename + "' to public/js/" + filename);
  } else {
    // Its css, so save it to the css folder
    file = fs.createWriteStream('public/css/' + filename);
    console.log("Saving '" + filename + "' to public/css/" + filename);
  }

  // Download the file
  var request = http.get(url, function(response) {
    response.pipe(file);
  });

}

for (var i = 0; i < dependencies.length; i++) {
  saveFile(dependencies[i]);
}
