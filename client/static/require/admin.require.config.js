requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./static/js",

    // All references to external resources
    paths: {
        "client/project/admin/main": "./moocchat/admin",

        "jquery": "./jquery/3.0.0/jquery.min",
        "socket.io-client": "./socket.io/1.4.6/socket.io.min",

        "ckeditor": "./ckeditor/4.5.11/ckeditor",
        "file-saver": "./FileSaver/1.3.2/FileSaver.min",
        "csv-js": "./CSV/3.6.4/csv.min"
    },

    shim: {
        "ckeditor": {
            exports: "CKEDITOR"
        }
    },

    // App entry point
    deps: ["client/project/admin/main"]
});