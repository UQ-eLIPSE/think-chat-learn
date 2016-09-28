requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./static/js",

    // All references to external resources
    paths: {
        "client/backup-client": "./moocchat/backup-client",

        "jquery": "./jquery/3.0.0/jquery.min",
        "socket.io-client": "./socket.io/1.4.6/socket.io.min"
    },

    // App entry point
    deps: ["client/backup-client"]
});