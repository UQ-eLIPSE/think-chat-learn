requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./static/js",

    // All references to external resources
    paths: {
        "client/main": "./moocchat/main",

        "jquery": "./jquery/3.0.0/jquery.min",
        "socket.io-client": "./socket.io/1.4.6/socket.io.min",
        "es6-promise": "./es6-promise/4.0.5/es6-promise.min"
    },

    // App entry point
    deps: ["client/main"]
});