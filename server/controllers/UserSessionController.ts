import express from "express";
import { BaseController } from "./BaseController";
import { UserSessionService } from "../services/UserSessionService";
import { IUserSession } from "../../common/interfaces/DBSchema";
import { UserService } from "../services/UserService";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { LoginResponse } from "../../common/interfaces/ToClientData";
import { isAdmin } from "../js/auth/AdminPageAuth";
export class UserSessionController extends BaseController {

    protected userSessionService: UserSessionService;
    protected userService: UserService;

    constructor(_userSessionService: UserSessionService) {
        super();
        this.userSessionService = _userSessionService;
    }

    private createSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.userSessionService.createOne(req.body as IUserSession).then((outgoingId) => {
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
        this.userSessionService.updateOne(req.body as IUserSession).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private getSessionById(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        if(!req.params.userSessionId) throw new Error('User session ID not supplied'); 
        this.userSessionService.findOne(req.params.userSessionId).then((response) => {
            res.json(response);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        // Don't need to check usersession id due to not existing just yet
        this.router.post("/create", StudentAuthenticatorMiddleware.checkUserId(),
            this.createSession.bind(this));
        this.router.put("/update", StudentAuthenticatorMiddleware.checkUserId(), StudentAuthenticatorMiddleware.checkUserSessionId(),
            this.updateSession.bind(this));
        this.router.get("/marking/:userSessionId", isAdmin(), this.getSessionById.bind(this))
    }
}
