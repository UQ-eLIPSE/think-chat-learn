var conf = require('./config/conf.json');

var express = require('express');
var app = express();

var http = require("http");
http.globalAgent.maxSockets = 65000;

var server = http.createServer(app).listen(conf.portNum);
var io = require('socket.io')(server, { serveClient: false });

global.conf = conf;
global.server = server;
global.io = io;

console.log('Socket.io server listening on port ' + conf.portNum);

var database = require('./build/controllers/database');
var websockets = require('./build/controllers/websockets');


// Use ejs for templating on pages
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");


// POST body parsing (required for LTI incoming data)
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
    extended: true
}));


// Everything under URL/* will be statically delivered from PROJECT/public/*
app.use(express.static(__dirname + "/public"));


// LTI launcher page only available in test mode
if (conf.lti && conf.lti.testMode) {
    app.get("/lti-launch", function(req, res) {
        res.render("lti-launch.ejs");
    });
}

// LTI intermediary (for incoming requests from Blackboard)
app.post("/lti.php", function(req, res) {
    res.render("lti-intermediary.ejs", { postData: req.body });
});

app.get("/lti.php", function(req, res) {
    res.render("lti-intermediary.ejs");
});

// Backup client
app.post("/backup-client", function(req, res) {
    res.render("backup-client.ejs", { postData: req.body });
});

app.get("/backup-client", function(req, res) {
    res.render("backup-client.ejs");
});

// MOOCchat standard client
app.post("/", function(req, res) {
    res.render("index.ejs", { conf: conf, postData: req.body });
});

app.get("/", function(req, res) {
    res.render("index.ejs", { conf: conf });
});
