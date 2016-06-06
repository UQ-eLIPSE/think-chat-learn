/**
 * build_index.js
 * Collects all of the components within the components folder and joins them together to
 * create the index.php file
 */

var concat = require('concat-files');
var fs = require('fs');

var CONFIG = {
    outputFile: "views/index.php",
    inputFolder: "src",
    inputComponentsFolder: "src/view_components"
};

/**
 * Gets a list of the view components files
 */
function getComponents(cb) {
  fs.readdir(CONFIG.inputComponentsFolder, function(err, files) {
    if (err) {
      console.log("ERROR");
    }

    var filePaths = [];
    for (var i = 0; i < files.length; i++) {
      filePaths.push(CONFIG.inputComponentsFolder + "/" + files[i]);
      console.log("Adding " + CONFIG.inputComponentsFolder + "/" + files[i]);
    }

    cb(filePaths);
  });
}

getComponents(function(files) {
  var allFiles = [CONFIG.inputFolder + '/index_template_head.php'];
  allFiles = allFiles.concat(files);
  allFiles.push(CONFIG.inputFolder + '/index_template_tail.php');

  concat(allFiles, CONFIG.outputFile, function() {
    console.log("Finished building index.php");
  });
});
