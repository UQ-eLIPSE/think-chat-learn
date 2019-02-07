import * as express from "express";
import { BaseController } from "./BaseController";
import { UserSessionService } from "../services/UserSessionService";
import { IUserSession } from "../../common/interfaces/DBSchema";
import { UserService } from "../services/UserService";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { LoginResponse } from "../../common/interfaces/ToClientData";
export class UserSessionController extends BaseController {

    protected userSessionService: UserSessionService;
    protected userService: UserService;

    constructor(_userSessionService: UserSessionService) {
        super();
        this.userSessionService = _userSessionService;
    }

    private createSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userSessionService.createUserSession(req.body as IUserSession).then((outgoingId) => {
            if (outgoingId !== null) {
                res.json({
                    outgoingId
                });
            } else {
                res.sendStatus(400);
            }
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private updateSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userSessionService.updateUserSession(req.body as IUserSession).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        // Don't need to check usersession id due to not existing just yet
        this.router.put("/create", StudentAuthenticatorMiddleware.checkUserId(),
            this.createSession.bind(this));
        this.router.post("/update", StudentAuthenticatorMiddleware.checkUserId(), StudentAuthenticatorMiddleware.checkUserSessionId(),
            this.updateSession.bind(this));
    }
}
