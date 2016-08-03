/**
 * Combines HTML pages into one.
 */
var concat = require("concat-files");
var mkdirp = require("mkdirp");
var fs = require("fs");


var srcDir = __dirname + "/../public/html/";
var outDir = __dirname + "/../public/combined-html/";

var outFilename = "all-pages.html";


function getPageFiles(onDone) {
    fs.readdir(srcDir, function(err, files) {
        if (err) {
            console.error(err);
            return;
        }

        onDone(files.map(function(file) {
            return srcDir + file;
        }));
    });
}



console.log("Combining HTML files...");

getPageFiles(function(files) {
    mkdirp(outDir, function(err) {
        if (err) {
            console.error(err);
            return;
        }

        concat(files, outDir + outFilename, function(err) {
            if (err) {
                console.error(err);
                return;
            }

            console.log("Finished combining HTML files.");
        });;
    })
});
