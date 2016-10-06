import { Conf } from "./config/Conf";

import * as express from "express";
import * as http from "http";
import * as SocketIO from "socket.io";
import * as bodyParser from "body-parser";

import { Logger } from "../common/js/Logger";

import { Moocchat } from "./js/Moocchat";
import { Api, ApiHandlerBase } from "./js/api/Api";

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


// POST body parsing
app.use(bodyParser.json());         // JSON-encoded for MOOCchat API
app.use(bodyParser.urlencoded({     // URL-encoded for LTI
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












console.log("Launching MOOCchat...");
const moocchat = new Moocchat(io);



// MOOCchat standard client
app.post("/", (req, res) => {
    res.render("index.ejs", { conf: Conf, postData: req.body });
});

app.get("/", (req, res) => {
    res.render("index.ejs", { conf: Conf });
});




AssociatePOSTEndpoint("/api/client/login/lti", Api.ClientLoginLti);

AssociateGETEndpoint("/api/client/quiz", Api.ClientQuiz);
AssociateGETEndpoint("/api/client/question", Api.ClientQuestion);
AssociateGETEndpoint("/api/client/question/:questionId/options", Api.ClientQuestion_Options);
AssociateGETEndpoint("/api/client/question/:questionId/correctOptions", Api.ClientQuestion_Options);

function AssociatePOSTEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.post(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        // Request body is the data we want
        // This would have been processed into a JS object via. Express
        const data = req.body || {};

        // Merge URL request params and session ID into body data
        Object.keys(req.params).forEach(key => data[key] = req.params[key]);

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}

function AssociateGETEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.get(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        const data: {[key: string]: any} = req.params;

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}
