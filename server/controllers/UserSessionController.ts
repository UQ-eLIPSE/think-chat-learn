import * as express from "express";
import { BaseController } from "./BaseController";
import { UserSessionService } from "../services/UserSessionService";
import { IUserSession} from "../../common/interfaces/DBSchema";

export class UserSessionController extends BaseController {

    protected userSessionService: UserSessionService;

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
        this.router.put("/create", this.createSession.bind(this));
        this.router.post("/update", this.updateSession.bind(this));
    }
}
