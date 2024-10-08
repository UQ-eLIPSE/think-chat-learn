import express from "express";
import http from "http";
import SocketIO from "socket.io";
import bodyParser from "body-parser";
import expressJwt from "express-jwt";
import jwt from "jsonwebtoken";
import { Db, MongoClient } from "mongodb";
import cors from "cors";

import { Moocchat } from "./js/Moocchat";
import Config from "./config/Config";
// Repos
import { UserRepository } from "./repositories/UserRepository";
import { QuestionRepository } from "./repositories/QuestionRepository";
import { QuizRepository } from "./repositories/QuizRepository";
import { UserSessionRepository } from "./repositories/UserSessionRepository";
import { QuizSessionRepository } from "./repositories/QuizSessionRepository";
import { ChatGroupRepository } from "./repositories/ChatGroupRepository";
import { ResponseRepository } from "./repositories/ResponseRepository";
import { MarksRepository } from "./repositories/MarksRepository";
import { CriteriaRepository } from "./repositories/CriteriaRepository";
import { CourseRepository } from "./repositories/CourseRepository";
import { RubricRepository } from "./repositories/RubricRepository";
// Services
import { UserService } from "./services/UserService";
import { QuestionService } from "./services/QuestionService";
import { QuizService } from "./services/QuizService";
import { UserSessionService } from "./services/UserSessionService";
import { QuizSessionService } from "./services/QuizSessionService";
import { ChatGroupService } from "./services/ChatGroupService";
import { ResponseService } from "./services/ResponseService";
import { MarksService } from "./services/MarksService";
import { CriteriaService } from "./services/CriteriaService";
import { CourseService } from "./services/CourseService";
import { RubricService } from "./services/RubricService";
// Controllers
import { UserController } from "./controllers/UserController";
import { QuestionController } from "./controllers/QuestionController";
import { QuizController } from "./controllers/QuizController";
import { UserSessionController } from "./controllers/UserSessionController";
import { QuizSessionController } from "./controllers/QuizSessionController";
import { ChatGroupController } from "./controllers/ChatGroupController";
import { ResponseController } from "./controllers/ResponseController";
import { MarksController } from "./controllers/MarksController";
import { CriteriaController } from "./controllers/CriteriaController";
import { RubricController } from "./controllers/RubricController";
import { ImageController } from "./controllers/ImageController";
// Authenticator for students
import { StudentAuthenticatorMiddleware } from "./js/auth/StudentPageAuth";
// Moocchat pool to initialize service
import { MoocchatWaitPool } from "./js/queue/MoocchatWaitPool";
import { MantaInterface } from "./manta/MantaInterface";
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
    private marksRepository: MarksRepository;
    private criteriaRepository: CriteriaRepository;
    private courseRepository: CourseRepository;
    private rubricRepository: RubricRepository;

    // Services
    private userService: UserService;
    private quizService: QuizService;
    private questionService: QuestionService;
    private userSessionService: UserSessionService;
    private quizSessionService: QuizSessionService;
    private chatGroupService: ChatGroupService;
    private responseService: ResponseService;
    private marksService: MarksService;
    private criteriaService: CriteriaService;
    private courseService: CourseService;
    private rubricService: RubricService;

    // Controllers
    private userController: UserController;
    private quizController: QuizController;
    private questionController: QuestionController;
    private userSessionController: UserSessionController;
    private quizSessionController: QuizSessionController
    private responseController: ResponseController;
    private chatGroupController: ChatGroupController;
    private marksController: MarksController;
    private criteriaController: CriteriaController;
    private rubricController: RubricController;
    private imageController: ImageController;

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
        const connection = await MongoClient.connect(Config.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        return connection.db();
    }

    // Initialises the db connections
    private bootstrap(): void {
        // Sets up manta connection
        MantaInterface.createMantaInstance();

        this.userRepository = new UserRepository(this.database, "uq_user");
        this.quizRepository = new QuizRepository(this.database, "uq_quizSchedule");
        this.questionRepository = new QuestionRepository(this.database, "uq_question");
        this.userSessionRepository = new UserSessionRepository(this.database, "uq_userSession");
        this.quizSessionRepository = new QuizSessionRepository(this.database, "uq_quizSession");
        this.chatGroupRepository = new ChatGroupRepository(this.database, "uq_chatGroup");
        this.responseRepository = new ResponseRepository(this.database, "uq_responses");
        this.marksRepository = new MarksRepository(this.database, "uq_marks");
        this.criteriaRepository = new CriteriaRepository(this.database, "uq_criteria");
        this.courseRepository = new CourseRepository(this.database, "uq_course");
        this.rubricRepository = new RubricRepository(this.database, "uq_rubrics");

        // Services
        this.userService = new UserService(this.userRepository, this.quizRepository, this.questionRepository,
            this.chatGroupRepository, this.quizSessionRepository, this.userSessionRepository, this.responseRepository,
            this.courseRepository, this.criteriaRepository, this.rubricRepository);
        this.quizService = new QuizService(this.quizRepository);
        this.questionService = new QuestionService(this.questionRepository);
        this.userSessionService = new UserSessionService(this.userSessionRepository);
        this.quizSessionService = new QuizSessionService(this.quizSessionRepository, this.userSessionRepository,
            this.quizRepository, this.responseRepository, this.questionRepository, this.userRepository);
        this.chatGroupService = new ChatGroupService(this.chatGroupRepository, this.responseRepository, this.quizSessionRepository,
            this.userSessionRepository, this.marksRepository, this.quizRepository)
        this.responseService = new ResponseService(this.responseRepository, this.quizSessionRepository, this.quizRepository);
        this.marksService = new MarksService(this.marksRepository, this.quizRepository, this.quizSessionRepository, this.chatGroupRepository,
            this.userSessionRepository, this.userRepository, this.rubricRepository, this.criteriaRepository);
        this.criteriaService = new CriteriaService(this.criteriaRepository);
        this.courseService = new CourseService(this.courseRepository);
        this.rubricService = new RubricService(this.rubricRepository, this.criteriaRepository);

        // Controllers
        this.userController = new UserController(this.userService);
        this.quizController = new QuizController(this.quizService);
        this.questionController = new QuestionController(this.questionService);
        this.userSessionController = new UserSessionController(this.userSessionService);
        this.quizSessionController = new QuizSessionController(this.quizSessionService, this.marksService);
        this.responseController = new ResponseController(this.responseService);
        this.chatGroupController = new ChatGroupController(this.chatGroupService);
        this.marksController = new MarksController(this.marksService);
        this.criteriaController = new CriteriaController(this.criteriaService);
        this.rubricController = new RubricController(this.rubricService);
        StudentAuthenticatorMiddleware.instantiate(this.userService, this.userSessionService, this.quizSessionService,
                this.responseService);
        this.imageController =  new ImageController();
        this.userController.setupRoutes();
        this.quizController.setupRoutes();
        this.questionController.setupRoutes();
        this.userSessionController.setupRoutes();
        this.quizSessionController.setupRoutes();
        this.responseController.setupRoutes();
        this.chatGroupController.setupRoutes();
        this.marksController.setupRoutes();
        this.imageController.setupRoutes();
        // Set up the wait pool service
        MoocchatWaitPool.AssignQuizService(this.quizService);

        this.criteriaController.setupRoutes();
        this.rubricController.setupRoutes();
    }

    private setupSockets(): void {
        // Generally the configuration for max sockets should be 65k to permit as many as possible
        http.globalAgent.maxSockets = Config.HTTP_MAX_SOCKETS;
        const server = http.createServer(this.express).listen(Config.PORT);
        const io = SocketIO(server, {
            serveClient: false,
        
            pingInterval: Config.SOCKET_PING_INTERVAL,
            pingTimeout: Config.SOCKET_PING_TIMEOUT
        });

        // Used to set up the moocchat sockets
        this.socketIO = new Moocchat(io, this.chatGroupService, this.responseService, this.quizSessionService).getSocketIO();
    }

    // For now we also open up teh sockets and h
    private setupRoutes(): void {
        console.log(`socket.io listening on ${Config.PORT}`);
        
        // TODO: Configure cors to be more secure
        this.express.use(cors());
        
        // Use ejs for templating on pages
        this.express.set("view engine", "ejs");
        this.express.set("views", __dirname + "/static/views");
        
        
        // POST body parsing
        this.express.use(bodyParser.json());         // JSON-encoded for MOOCchat API
        this.express.use(bodyParser.urlencoded({     // URL-encoded for LTI
            extended: true
        }));
        
        // Token refresher. Only runs during login
        this.express.use(this.authFilter("/user/login", expressJwt({ secret: Config.JWT_SECRET })));
        this.express.use(this.authFilter("/user/login", this.refreshJWT));
        
        console.log("Setting up endpoints...");
        
        
        // If static content delivery by Express is enabled,
        // everything under URL/static/* will be statically delivered from PROJECT/build/client/*
        if (Config.SERVE_STATIC_CONTENT) {
        
            // Note that express will attempt to find the file.
            // For logging in we use the api endpoints (and redirect there)
            this.express.use("/client", express.static(__dirname + Config.CLIENT_RELATIVE_FOLDER));
            this.express.use("/admin", express.static(__dirname + Config.ADMIN_RELATIVE_FOLDER));
            this.express.use("/intermediate", express.static(__dirname + Config.INTERMEDIATE_RELATIVE_FOLDER));
        }

        this.express.use("/images", express.static(Config.IMAGE_UPLOAD_LOCAL_PATH));
        
        // LTI launcher page only available in test mode
        if (Config?.LTI_TEST_MODE) {
            this.express.get("/lti-launch", function(req, res) {
                res.render("lti-launch.ejs");
            });
        
            this.express.get("/demo-login", function(req, res) {
                res.render("lti-launch-2.ejs", { conf: Config });
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
        
        
        
        // // MOOCchat standard client
        // this.express.post("/", (req, res) => {
        //     res.render("index.ejs", { conf: Conf, postData: req.body });
        // });
        
        // this.express.get("/", (req, res) => {
        //     res.render("index.ejs", { conf: Conf });
        // });
        
        // // Admin client
        // this.express.post("/admin", function(req, res) {
        //     res.render("admin.ejs", { postData: req.body });
        // });
        
        this.express.use("/user", this.userController.getRouter());
        this.express.use("/quiz", this.quizController.getRouter());
        this.express.use("/question", this.questionController.getRouter());
        this.express.use("/usersession", this.userSessionController.getRouter());
        this.express.use("/quizsession", this.quizSessionController.getRouter());
        this.express.use("/response", this.responseController.getRouter());
        this.express.use("/chatgroup", this.chatGroupController.getRouter());
        this.express.use("/marks", this.marksController.getRouter());
        this.express.use("/criteria", this.criteriaController.getRouter());
        this.express.use("/rubric", this.rubricController.getRouter());
        this.express.use("/image", this.imageController.getRouter());
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

        const token = jwt.sign(oldToken, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
        res.setHeader("Access-Token", token);
        res.setHeader("Access-Control-Expose-Headers", "Access-Token");
        return next();
    }

}