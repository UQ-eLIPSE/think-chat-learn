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
        });

    }

    public setupRoutes() {
        this.router.post("/login", this.handleLTILogin.bind(this));
    }
}
