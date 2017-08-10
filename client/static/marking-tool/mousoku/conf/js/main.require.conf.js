requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./build/js",

    // All references to external resources
    paths: {
        "jquery": "../../lib/js/jquery/3.1.0/jquery.min",
        "FileSaver": "../../lib/js/FileSaver/1.3.2/FileSaver.min",
        "diff": "../../lib/js/jsdiff/2.2.3/diff.min"
    }
});