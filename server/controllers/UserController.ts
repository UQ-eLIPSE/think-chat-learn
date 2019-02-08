import * as express from "express";
import * as jwt from "jsonwebtoken";
import { BaseController } from "./BaseController";
import { UserService } from "../services/UserService";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { Conf } from "../config/Conf";

export class UserController extends BaseController {

    protected userService: UserService;

    constructor(_userService: UserService) {
        super();
        this.userService = _userService;
    }

    private handleLTILogin(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleLogin(req.body as ILTIData).then((output) => {
            const token = jwt.sign(output as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });
            res.redirect(Conf.clientPage + "?q=" + token);
        }).catch((e: Error) => {
            res.status(500).send(e.message);
        });

    }

    // The reason for the second end point is if the admin wants to pretend to be a student
    private handleAdminLogin(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleAdminLogin(req.body as ILTIData).then((output) => {
            const token = jwt.sign(output as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });
            res.redirect(Conf.adminPage + "?q=" + token);
        });
    }
    private refreshToken(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        res.sendStatus(200);
    }

    private getQuizByToken(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userService.handleFetch(req.user).then((output) => {
            res.json(jwt.sign(output as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN }));
        }).catch((e) => {
            console.log(e);
        });
    }    

    public setupRoutes() {
        this.router.post("/admin", this.handleAdminLogin.bind(this));
        this.router.post("/login", this.handleLTILogin.bind(this));
        this.router.post("/me", this.refreshToken.bind(this));
        this.router.post("/handleToken", this.getQuizByToken.bind(this));
    }
}
