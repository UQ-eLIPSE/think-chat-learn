// Attach timestamps to all logged messages
function timestampedLoggerFactory(origLoggerFunc) {
    return function(e) {
        arguments[0] = "[" + new Date().toISOString() + "] " + arguments[0];
        origLoggerFunc.apply(void 0, arguments);
    }
}

console.error = timestampedLoggerFactory(console.error);
console.log = timestampedLoggerFactory(console.log);

process.on('uncaughtException', function(e) {
    console.error(e.stack || e);
});

// ============================================================================

var conf = require('./config/conf.json');

var express = require('express');
var app = express();

var http = require("http");
http.globalAgent.maxSockets = 65000;

var server = http.createServer(app).listen(conf.portNum);
var io = require('socket.io')(server, { 
    serveClient: false,

    pingInterval: 5000,    // Ping roughly every 5 seconds
    pingTimeout: 16000      // Timeout must be greater than interval
 });

global.conf = conf;
global.server = server;
global.io = io;

console.log('Socket.io server listening on port ' + conf.portNum);

var database = require('./build/server/js/controllers/database');
var websockets = require('./build/server/js/controllers/websockets');

// Use ejs for templating on pages
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");


// POST body parsing (required for LTI incoming data)
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
    extended: true
}));


// If static content delivery by Express is enabled,
// everything under URL/static/* will be statically delivered from PROJECT/public/*
if (conf.express && conf.express.serveStaticContent) {
    app.use("/static", express.static(__dirname + "/public"));
}

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

// VirtServer backups
app.post("/virtserver-backup", function(req, res) {
    var input = req.body;

    console.log("VirtServer backup", input);

    if (!input) {
        res.sendStatus(400);
        return;
    }

    database.virtServerBackups.create(
        {
            timestamp: new Date(),
            json: input.data.toString()
        },
        function(err, result) {
            if (err) {
                res.sendStatus(500);
                console.err(err);
                return;
            }
            
            res.sendStatus(200);
        });
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
