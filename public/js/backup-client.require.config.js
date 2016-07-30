requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./static/js/moocchat2",

    // All references to external resources
    paths: {
        "jquery": "../lib/jquery/3.0.0/jquery.min",
        "socket.io-client": "../lib/socket.io/1.4.6/socket.io.min"
    },

    // App entry point
    deps: ["backup-client"]
});