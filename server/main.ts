import {Conf} from "./config/Conf";

import * as express from "express";
import * as http from "http";
import * as SocketIO from "socket.io";
import * as bodyParser from "body-parser";

import {Logger} from "../common/js/Logger";

import {Moocchat} from "./js/Moocchat";

// Initialise logger proxy for timestamping console output
Logger.Init({
    enableLogProxy: true,
    enableTimestamp: true,
});

// If there are exceptions, we should try to have the whole stack outputted to the log
process.on("uncaughtException", (e: Error) => {
    console.error(e.stack || e);
});



console.log("Setting up server application...");



// Generally the configuration for max sockets should be 65k to permit as many as possible
http.globalAgent.maxSockets = Conf.http.maxSockets;


// Launch the app
const app = express();
const server = http.createServer(app).listen(Conf.portNum);
const io = SocketIO(server, {
    serveClient: false,

    pingInterval: Conf.socketIo.pingInterval,
    pingTimeout: Conf.socketIo.pingTimeout
});

console.log(`socket.io listening on ${Conf.portNum}`);


// Use ejs for templating on pages
app.set("view engine", "ejs");
app.set("views", __dirname + "/static/views");


// POST body parsing (required for LTI incoming data)
app.use(bodyParser.urlencoded({
    extended: true
}));




console.log("Setting up endpoints...");


// If static content delivery by Express is enabled,
// everything under URL/static/* will be statically delivered from PROJECT/build/client/*
if (Conf.express && Conf.express.serveStaticContent) {
    app.use("/static", express.static(__dirname + "/../client/static"));
}

// LTI launcher page only available in test mode
if (Conf.lti && Conf.lti.testMode) {
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
    res.render("index.ejs", { conf: Conf, postData: req.body });
});

app.get("/", function(req, res) {
    res.render("index.ejs", { conf: Conf });
});



console.log("Launching MOOCchat...");
new Moocchat(io);