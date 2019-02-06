import * as express from "express";
import * as http from "http";
import * as SocketIO from "socket.io";
import * as bodyParser from "body-parser";
import * as expressJwt from "express-jwt";
import * as jwt from "jsonwebtoken";import { Db, MongoClient } from "mongodb";

import { Moocchat } from "./js/Moocchat";
import { Conf } from "./config/Conf";
// Repos
import { UserRepository } from "./repositories/UserRepository";
import { QuestionRepository } from "./repositories/QuestionRepository";
import { QuizRepository } from "./repositories/QuizRepository";
import { UserSessionRepository } from "./repositories/UserSessionRepository";
import { QuizSessionRepository } from "./repositories/QuizSessionRepository";
import { ChatGroupRepository } from "./repositories/ChatGroupRepository";
import { ResponseRepository } from "./repositories/ResponseRepository";

// Services
import { UserService } from "./services/UserService";
import { QuestionService } from "./services/QuestionService";
import { QuizService } from "./services/QuizService";
import { UserSessionService } from "./services/UserSessionService";
import { QuizSessionService } from "./services/QuizSessionService";
import { ChatGroupService } from "./services/ChatGroupService";
import { ResponseService } from "./services/ResponseService";

// Controllers
import { UserController } from "./controllers/UserController";
import { QuestionController } from "./controllers/QuestionController";
import { QuizController } from "./controllers/QuizController";
import { UserSessionController } from "./controllers/UserSessionController";
import { QuizSessionController } from "./controllers/QuizSessionController";
import { ChatGroupController } from "./controllers/ChatGroupController";
import { ResponseController } from "./controllers/ResponseController";

export default class App {

    // Express things
    private express: express.Application;

    // Setting up the db and its tables
    private database: Db;

    // Repos
    private userRepository: UserRepository;
    private quizRepository: QuizRepository;
    private questionRepository: QuestionRepository;
    private userSessionRepository: UserSessionRepository;
    private quizSessionRepository: QuizSessionRepository;
    private chatGroupRepository: ChatGroupRepository;
    private responseRepository: ResponseRepository;

    // Services
    private userService: UserService;
    private quizService: QuizService;
    private questionService: QuestionService;
    private userSessionService: UserSessionService;
    private quizSessionService: QuizSessionService;
    private chatGroupService: ChatGroupService;
    private responseService: ResponseService;

    // Controllers
    private userController: UserController;
    private quizController: QuizController;
    private questionController: QuestionController;
    private userSessionController: UserSessionController;
    private quizSessionController: QuizSessionController
    private responseController: ResponseController;
    private chatGroupController: ChatGroupController;

    // Socket io things
    private socketIO: SocketIO.Server;

    constructor() {
        this.express = express();
    }

    public getServer(): express.Application {
        return this.express;
    }

    public async init(): Promise<void> {
        this.database = await this.connectDb();

        this.bootstrap();
        this.setupSockets();
        this.setupRoutes();
    }

    
    private async connectDb(): Promise<Db> {
        // The conf.database variable should have the db as part of the url
        const connection = await MongoClient.connect(Conf.database, { useNewUrlParser: true });
        return connection.db();
    }

    // Initialises the db connections
    private bootstrap(): void {
        this.userRepository = new UserRepository(this.database, "uq_user");
        this.quizRepository = new QuizRepository(this.database, "uq_quizSchedule");
        this.questionRepository = new QuestionRepository(this.database, "uq_question");
        this.userSessionRepository = new UserSessionRepository(this.database, "uq_userSession");
        this.quizSessionRepository = new QuizSessionRepository(this.database, "uq_quizSession");
        this.chatGroupRepository = new ChatGroupRepository(this.database, "uq_chatGroup");
        this.responseRepository = new ResponseRepository(this.database, "uq_responses");

        this.userService = new UserService(this.userRepository, this.quizRepository, this.questionRepository);
        this.quizService = new QuizService(this.quizRepository);
        this.questionService = new QuestionService(this.questionRepository);
        this.userSessionService = new UserSessionService(this.userSessionRepository);
        this.quizSessionService = new QuizSessionService(this.quizSessionRepository, this.userSessionRepository);
        this.chatGroupService = new ChatGroupService(this.chatGroupRepository, this.responseRepository);
        this.responseService = new ResponseService(this.responseRepository, this.quizSessionRepository, this.quizRepository);

        this.userController = new UserController(this.userService);
        this.quizController = new QuizController(this.quizService);
        this.questionController = new QuestionController(this.questionService);
        this.userSessionController = new UserSessionController(this.userSessionService);
        this.quizSessionController = new QuizSessionController(this.quizSessionService);
        this.responseController = new ResponseController(this.responseService);
        this.chatGroupController = new ChatGroupController(this.chatGroupService);

        this.userController.setupRoutes();
        this.quizController.setupRoutes();
        this.questionController.setupRoutes();
        this.userSessionController.setupRoutes();
        this.quizSessionController.setupRoutes();
        this.responseController.setupRoutes();
        this.chatGroupController.setupRoutes();
    }

    private setupSockets(): void {
        // Generally the configuration for max sockets should be 65k to permit as many as possible
        http.globalAgent.maxSockets = Conf.http.maxSockets;
        const server = http.createServer(this.express).listen(Conf.portNum);
        const io = SocketIO(server, {
            serveClient: false,
        
            pingInterval: Conf.socketIo.pingInterval,
            pingTimeout: Conf.socketIo.pingTimeout
        });

        // Used to set up the moocchat sockets
        this.socketIO = new Moocchat(io, this.chatGroupService, this.responseService, this.quizSessionService).getSocketIO();
    }

    // For now we also open up teh sockets and h
    private setupRoutes(): void {
        console.log(`socket.io listening on ${Conf.portNum}`);
        
        
        // Use ejs for templating on pages
        this.express.set("view engine", "ejs");
        this.express.set("views", __dirname + "/static/views");
        
        
        // POST body parsing
        this.express.use(bodyParser.json());         // JSON-encoded for MOOCchat API
        this.express.use(bodyParser.urlencoded({     // URL-encoded for LTI
            extended: true
        }));
        
        // Token refresher. Only runs during login
        this.express.use(this.authFilter("/user/login", expressJwt({ secret: Conf.jwt.SECRET })));
        this.express.use(this.authFilter("/user/login", this.refreshJWT));
        
        console.log("Setting up endpoints...");
        
        
        // If static content delivery by Express is enabled,
        // everything under URL/static/* will be statically delivered from PROJECT/build/client/*
        if (Conf.express && Conf.express.serveStaticContent) {
        
            // Note that express will attempt to find the file.
            // For logging in we use the api endpoints (and redirect there)
            this.express.use("/client", express.static(__dirname + Conf.folders.clientFolder));
            this.express.use("/admin", express.static(__dirname + Conf.folders.adminFolder));
        }
        
        // LTI launcher page only available in test mode
        if (Conf.lti && Conf.lti.testMode) {
            this.express.get("/lti-launch", function(req, res) {
                res.render("lti-launch.ejs");
            });
        
            this.express.get("/demo-login", function(req, res) {
                res.render("lti-launch-2.ejs", { conf: Conf });
            });
        }
        
        // LTI intermediary (for incoming requests from Blackboard)
        this.express.post("/lti.php", function(req, res) {
            res.render("lti-intermediary.ejs", { postData: req.body });
        });
        
        this.express.get("/lti.php", function(req, res) {
            res.render("lti-intermediary.ejs");
        });
        
        // Backup client
        this.express.post("/backup-client", function(req, res) {
            res.render("backup-client.ejs", { postData: req.body });
        });
        
        this.express.get("/backup-client", function(req, res) {
            res.render("backup-client.ejs");
        });
        
        console.log("Launching MOOCchat...");
        
        
        
        // MOOCchat standard client
        this.express.post("/", (req, res) => {
            res.render("index.ejs", { conf: Conf, postData: req.body });
        });
        
        this.express.get("/", (req, res) => {
            res.render("index.ejs", { conf: Conf });
        });
        
        // Admin client
        this.express.post("/admin", function(req, res) {
            res.render("admin.ejs", { postData: req.body });
        });
        
        this.express.use("/user", this.userController.getRouter());
        this.express.use("/quiz", this.quizController.getRouter());
        this.express.use("/question", this.questionController.getRouter());
        this.express.use("/usersession", this.userSessionController.getRouter());
        this.express.use("/quizsession", this.quizSessionController.getRouter());
        this.express.use("/response", this.responseController.getRouter());
        this.express.use("/chatgroup", this.chatGroupController.getRouter());
    }

    // Only login gets affected
    private authFilter(path: any, middleware: any) {
        return function(req: express.Request, res: express.Response, next: express.NextFunction): void {
            // Checks for authorisation and login
            if ((req.path == path) || !req.header("authorization")) {
                return next();
            }
            return middleware(req, res, next);
        }
    }


    // Note that the user and the associated coures shouldn't change often
    private refreshJWT(req: express.Request, res: express.Response, next: express.NextFunction): void {
        const oldToken = req.user;
        delete oldToken.iat;
        delete oldToken.exp;

        const token = jwt.sign(oldToken, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });
        res.setHeader("Access-Token", token);
        res.setHeader("Access-Control-Expose-Headers", "Access-Token");
        return next();
    }

}