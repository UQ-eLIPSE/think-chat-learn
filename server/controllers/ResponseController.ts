import * as express from "express";
import { BaseController } from "./BaseController";
import { ResponseService } from "../services/ResponseService";
import { Response } from "../../common/interfaces/ToClientData";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";

export class ResponseController extends BaseController {

    protected responseService: ResponseService;

    constructor(_responseService: ResponseService) {
        super();
        this.responseService = _responseService;
    }

    private createResponse(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.responseService.createResponse(req.body as Response).then((outgoingId) => {
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

    private getResponsesByQuizSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.responseService.getResponsesByQuizSession(req.params.quizSessionId).then((responses) => {
            res.json({
                data: responses
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.put("/create", StudentAuthenticatorMiddleware.checkUserId(), StudentAuthenticatorMiddleware.checkResponseBody(),
            this.createResponse.bind(this));
        this.router.get("/quizSession/:quizSessionId", this.getResponsesByQuizSession.bind(this));
    }
}
