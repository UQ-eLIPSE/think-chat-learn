var concat = require('concat-files');
var fs = require('fs');

/**
 * Gets a list of the view components files
 */
function getComponents(cb) {
  fs.readdir('view_components', function(err, files) {
    if (err) {
      console.log("ERROR");
    }

    var filePaths = [];
    for (var i = 0; i < files.length; i++) {
      filePaths.push('view_components/' + files[i]);
      console.log("Adding view_components/" + files[i]);
    }

    cb(filePaths);
  });
}

getComponents(function(files) {
  var allFiles = ['views/index_template_head.php'];
  allFiles = allFiles.concat(files);
  allFiles.push('views/index_template_tail.php');

  concat(allFiles, 'views/index.php', function() {
    console.log("Finished building index.php");
  });
});
