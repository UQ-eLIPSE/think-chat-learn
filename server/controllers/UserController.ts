import express from "express";
import jwt from "jsonwebtoken";
import { BaseController } from "./BaseController";
import { UserService } from "../services/UserService";
import { ILTIData } from "../../common/interfaces/ILTIData";
import Config from "../config/Config";
import { isAdmin } from "../js/auth/AdminPageAuth";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { LoginResponse } from "../../common/interfaces/ToClientData";

export class UserController extends BaseController {

    protected userService: UserService;

    constructor(_userService: UserService) {
        super();
        this.userService = _userService;
    }

    private handleLTILogin(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleLogin(req.body as ILTIData).then((output) => {
            const token = jwt.sign(output as Object, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
            res.redirect(Config.CLIENT_URL + "?q=" + token);
        }).catch((e: Error) => {
            res.status(500).send(e.message);
        });

    }

    // Essentially the same as LTI login except we write the token differently
    private handleLTIBackupLogin(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleBackupLogin(req.body as ILTIData).then((output) => {
            const token = jwt.sign(output as Object, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
            res.redirect(Config.INTERMEDIATE_URL + "?q=" + token);
        }).catch((e: Error) => {
            res.status(500).send(e.message);
        });

    }    

    // The reason for the second end point is if the admin wants to pretend to be a student
    private handleAdminLogin(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleAdminLogin(req.body as ILTIData).then((output) => {
            const token = jwt.sign(output as Object, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
            res.redirect(Config.ADMIN_URL + "?q=" + token);
        });
    }

    private registerIntermediate(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.registerIntermediate(req.user, req.body).then((output) => {
            const token = jwt.sign(output.token as Object, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
            res.json({ token, responses: output.responses});
        });
    }

    private handleLoginWrapper(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        this.userService.handleLoginWrapper(req.body as ILTIData).then((output) => {
            if(output.isAdmin) {
                return res.send(output.html)
            } else {
                return next!();
            }
        }).catch((e: Error) => {
            res.status(500).send(e.message);
        });
    }


    private refreshToken(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        res.sendStatus(200);
    }

    private getQuizByToken(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleFetch(req.user).then((output) => {
            res.json(jwt.sign(output as Object, Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN }));
        }).catch((e) => {
            console.log(e);
        });
    }

    private async launchQuizById(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        const decodedToken = req.user as LoginResponse;
        const quizId = req.body.quizId;
        const courseId = decodedToken.courseId;

        if(!quizId || !decodedToken || !courseId) return res.sendStatus(500);
        
        const available = await this.userService.isQuizIdActiveForUserCourse(courseId, quizId);

        if(available) {
            const token = jwt.sign(Object.assign({}, req.user, { quizId, available }), Config.JWT_SECRET, { expiresIn: Config.JWT_TOKEN_LIFESPAN });
            return res.json({
                payload: token
            }).status(200);
        }

        return res.sendStatus(500);
    }

    private getPageByIds(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handlePageRequest(req.body.quizId, req.body.pageId, req.body.quizSessionId, req.body.groupId).then((output) => {
            res.json(output);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(500);
        })
    }

    private getQuizQuestionForReconnect(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleReconnect(req.body.quizId, req.body.quizSessionId, req.body.groupId).then((output) => {
            res.json(output);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(500);
        })        
    }

    private getUserById(req: express.Request, res: express.Response) {
        if(!req.params.userId) throw new Error("User id not supplied");
        this.userService.findOne(req.params.userId).then((userResponse) => {
            res.json(userResponse);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.post("/admin", this.handleAdminLogin.bind(this));
        this.router.post("/admin-login", this.handleLTILogin.bind(this));
        this.router.post("/admin-intermediate-login", this.handleLTIBackupLogin.bind(this));
        this.router.post("/login", this.handleLoginWrapper.bind(this), this.handleLTILogin.bind(this));
        this.router.post("/intermediate-register", this.registerIntermediate.bind(this));
        this.router.post("/me", this.refreshToken.bind(this));
        this.router.post("/launch-quiz", StudentAuthenticatorMiddleware.checkUserId(), this.launchQuizById.bind(this));
        this.router.post("/handleToken", this.getQuizByToken.bind(this));
        this.router.post("/page", this.getPageByIds.bind(this));
        this.router.post("/reconnectData", this.getQuizQuestionForReconnect.bind(this));
        this.router.get("/marking/:userId", isAdmin(), this.getUserById.bind(this));
    }
}
