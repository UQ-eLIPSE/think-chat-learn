var express = require('express');
var app = express();

global.app = app;

var conf;
if (process.argv.length >= 2 + 1) {
    conf = require(process.argv[2]);
} else {
    conf = require('./config/conf.json');
}

global.conf = conf;

if (conf.ssl) {
    var options = {
        key: fs.readFileSync(conf.key),
        cert: fs.readFileSync(conf.cert)
    };
    server = https.createServer(options, app).listen(conf.portNum);
} else {
    server = require('http').createServer(app).listen(conf.portNum);
    console.log('Socket.io server listening on port ' + conf.portNum);
}

var io = require('socket.io')(server, { serveClient: false });

global.io = io;
global.server = server;

// Load the database module
var database = require('./controllers/database');
global.db = database.db;
global.collections = database.collections;

// Load the websocket
var websockets = require('./controllers/websockets');



// Use ejs for templating on pages
app.set("view engine", "ejs");


// POST body parsing
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
    extended: true
}));


// Everything under URL/* will be statically delivered from PROJECT/public/*
app.use(express.static('public'));


// LTI test page
app.get("/lti-test", function(req, res) {
    res.render("lti-test.ejs");
});

// LTI test page
app.get("/backup-client", function(req, res) {
    res.render("backup-client.ejs");
});

// MOOCchat index page with POST data should pass POST along
app.post("/", function(req, res) {
    res.render("index.ejs", { postData: req.body });
});

// MOOCchat index page with no POST data
app.get("/", function(req, res) {
    res.render("index.ejs");
});
