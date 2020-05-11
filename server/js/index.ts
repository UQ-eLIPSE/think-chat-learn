import * as mongodb from "mongodb";

import * as IPacSeqSocketPacket from "../../common/interfaces/IPacSeqSocketPacket";

import { ChatEndpoint } from "./websocket/endpoint/ChatEndpoint";
import { UserLoginEndpoint } from "./websocket/endpoint/UserLoginEndpoint";
/*import { AnswerSubmissionEndpoint } from "./websocket/endpoint/AnswerSubmissionEndpoint";
import { SurveyEndpoint } from "./websocket/endpoint/SurveyEndpoint";
import { BackupClientEndpoint } from "./websocket/endpoint/BackupClientEndpoint";*/
import { SocketResyncEndpoint } from "./websocket/endpoint/SocketResyncEndpoint";

import { PacSeqSocket_Server } from "../../common/js/PacSeqSocket_Server";
import { ChatGroupService } from "../services/ChatGroupService";
import { ResponseService } from "../services/ResponseService";
import { QuizSessionService } from "../services/QuizSessionService";
import { SocketSession } from "./websocket/SocketSession";

export class Main {
    private socketIO: SocketIO.Server;
    private db: mongodb.Db;
    private chatGroupService: ChatGroupService;
    private responseService: ResponseService;
    private quizSessionService: QuizSessionService;
    // Temporarily null
    //private chatMessageService: ChatMessageService;

    // Put in the appropiate services as well
    constructor(socketIO: SocketIO.Server, chatGroupService: ChatGroupService, responseService: ResponseService,
            quizSessionService: QuizSessionService) {
        this.socketIO = socketIO;
        this.chatGroupService = chatGroupService;
        this.responseService = responseService;
        this.quizSessionService = quizSessionService;
        this.setup();
    }

    private instantiateSocket(socketIoSocket: SocketIO.Socket) {
        console.log(`socket.io/${socketIoSocket.id} CONNECTION`);


        // Wrap socket with PacSeqSocket
        const socket = new PacSeqSocket_Server(socketIoSocket);
        socket.enableInboundLogging();
        socket.enableOutboundLogging();

        socket.use((packet: SocketIO.Packet, next) => {
            // Middleware for the sockets. Essentially ack
            // packets are fine but dats need to be checked to see
            // if they exist

            const packetName = packet[0];

            switch (packetName) {
                case IPacSeqSocketPacket.EventName.ACK:
                    next();
                    break;
                case IPacSeqSocketPacket.EventName.DAT:
                    const eventName = (packet[1] as IPacSeqSocketPacket.Packet.DAT).event;
                    if (!((eventName === "storeQuizSessionSocket") || (eventName === "sessionSocketResync"))) {
                        if (!SocketSession.GetSocketSessionBySocketId(socket.id)) {
                            throw Error("Could not find the socket for socket events");
                        }
                    }
                    next();
                    break;
                default:
                    throw Error("Unknown packet name");
            }
        });

        // This registration of a dummy function is kept to allow PacSeqSocket
        // to log disconnects (by triggering an event handler registration)
        //
        // Logouts are now explicit and are handled through user session related endpoints
        //socket.on("disconnect", () => {});


        // Set up websocket endpoints
        const chatEndpoint = new ChatEndpoint(socket, this.responseService, this.chatGroupService, null);
        const userLoginEndpoint = new UserLoginEndpoint(socket, this.quizSessionService);
        //const answerSubmissionEndpoint = new AnswerSubmissionEndpoint(socket, this.db);
        //const surveyEndpoint = new SurveyEndpoint(socket, this.db);
        //const backupClientEndpoint = new BackupClientEndpoint(socket, this.db);
        const socketResyncEndpoint = new SocketResyncEndpoint(socket, this.quizSessionService);

        chatEndpoint.registerAllEndpointSocketEvents();
        userLoginEndpoint.registerAllEndpointSocketEvents();
        //answerSubmissionEndpoint.registerAllEndpointSocketEvents();
        //surveyEndpoint.registerAllEndpointSocketEvents();
        //backupClientEndpoint.registerAllEndpointSocketEvents();
        socketResyncEndpoint.registerAllEndpointSocketEvents();
    }

    private async setup() {
        // On each socket connection, join up to websocket endpoints
        this.socketIO.sockets.on("connection", this.instantiateSocket.bind(this));

        console.log("Think.Chat.Learn set up complete");
        //});
    }

    public getSocketIO() {
        return this.socketIO;
    }    
}
