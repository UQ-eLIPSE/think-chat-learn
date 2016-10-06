import * as mongodb from "mongodb";

import { Conf } from "../config/Conf";
import { Database } from "./data/Database";

import { ChatEndpoint } from "./websocket/endpoint/ChatEndpoint";
import { UserLoginEndpoint } from "./websocket/endpoint/UserLoginEndpoint";
import { AnswerSubmissionEndpoint } from "./websocket/endpoint/AnswerSubmissionEndpoint";
import { SurveyEndpoint } from "./websocket/endpoint/SurveyEndpoint";
import { BackupClientEndpoint } from "./websocket/endpoint/BackupClientEndpoint";
import { SocketResyncEndpoint } from "./websocket/endpoint/SocketResyncEndpoint";

import { PacSeqSocket_Server } from "../../common/js/PacSeqSocket_Server";

export class Moocchat {
    private socketIO: SocketIO.Server;
    private db: mongodb.Db;

    constructor(socketIO: SocketIO.Server) {
        this.socketIO = socketIO;
        this.setup();
    }

    private setup() {
        Database.Connect(Conf.database, (err, db) => {
            if (err) {
                return console.error(err.message);
            }


            // Set DB connection now that we have it
            this.db = db;


            // On each socket connection, join up to websocket endpoints
            this.socketIO.sockets.on("connection", (socketIoSocket) => {
                console.log(`socket.io/${socketIoSocket.id} CONNECTION`);


                // Wrap socket with PacSeqSocket
                const socket = new PacSeqSocket_Server(socketIoSocket);
                socket.enableInboundLogging();
                socket.enableOutboundLogging();


                // This registration of a dummy function is kept to allow PacSeqSocket
                // to log disconnects (by triggering an event handler registration)
                //
                // Logouts are now explicit and are handled through user session related endpoints
                socket.on("disconnect", () => { });


                // Set up websocket endpoints
                const chatEndpoint = new ChatEndpoint(socket, this.db);
                const userLoginEndpoint = new UserLoginEndpoint(socket, this.db);
                const answerSubmissionEndpoint = new AnswerSubmissionEndpoint(socket, this.db);
                const surveyEndpoint = new SurveyEndpoint(socket, this.db);
                const backupClientEndpoint = new BackupClientEndpoint(socket);
                const socketResyncEndpoint = new SocketResyncEndpoint(socket);

                chatEndpoint.registerAllEndpointSocketEvents();
                userLoginEndpoint.registerAllEndpointSocketEvents();
                answerSubmissionEndpoint.registerAllEndpointSocketEvents();
                surveyEndpoint.registerAllEndpointSocketEvents();
                backupClientEndpoint.registerAllEndpointSocketEvents();
                socketResyncEndpoint.registerAllEndpointSocketEvents();
            });

            console.log("MOOCchat set up complete");
        });
    }

    public getDb() {
        return this.db;
    }
}
