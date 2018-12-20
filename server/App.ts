import * as express from "express";
import * as http from "http";
import * as SocketIO from "socket.io";
import * as bodyParser from "body-parser";
import * as expressJwt from "express-jwt";
import * as jwt from "jsonwebtoken";import { Db, MongoClient } from "mongodb";

import { Conf } from "./config/Conf";
import { UserRepository } from "./repositories/UserRepository";
import { QuizRepository } from "./repositories/QuizRepository";
import { UserService } from "./services/UserService";
import { QuizService } from "./services/QuizService";
import { UserController } from "./controllers/UserController";
import { QuizController } from "./controllers/QuizController";
import { Moocchat } from "./js/Moocchat";
export default class App {

    // Express things
    private express: express.Application;

    // Setting up the db and its tables
    private database: Db;

    // Repos
    private userRepository: UserRepository;
    private quizRepository: QuizRepository;

    // Services
    private userService: UserService;
    private quizService: QuizService;

    // Controllers
    private userController: UserController;
    private quizController: QuizController;

    constructor() {
        this.express = express();
    }

    public getServer(): express.Application {
        return this.express;
    }

    public async init(): Promise<void> {
        this.database = await this.connectDb();
        this.setupSockets();
        this.bootstrap();
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

        this.userService = new UserService(this.userRepository, this.quizRepository);
        this.quizService = new QuizService(this.quizRepository);

        this.userController = new UserController(this.userService);
        this.quizController = new QuizController(this.quizService);

        this.userController.setupRoutes();
        this.quizController.setupRoutes();
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
        const moocchat = new Moocchat(io);
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
        //this.express.use(this.authFilter("/user/login", expressJwt({ secret: Conf.jwt.SECRET })));
        //this.express.use(this.authFilter("/user/login", this.refreshJWT));
        
        
        console.log("Setting up endpoints...");
        
        
        // If static content delivery by Express is enabled,
        // everything under URL/static/* will be statically delivered from PROJECT/build/client/*
        if (Conf.express && Conf.express.serveStaticContent) {
        
            // Note that express will attempt to find the file.
            // For logging in we use the api endpoints (and redirect there)
            this.express.use("/client", express.static(__dirname + "/../../client/dist/"));
            this.express.use("/admin", express.static(__dirname + "/../../admin/dist/"));
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