requirejs.config({
    // Relative to URL of public page (not server filesystem path)
    baseUrl: "./js/moocchat2",

    // All references to external resources
    paths: {
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min",
        "socket.io-client": "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.6/socket.io.min"
    },

    // App entry point
    deps: ["backup-client"]
});