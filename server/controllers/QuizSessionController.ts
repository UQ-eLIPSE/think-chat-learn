import * as express from "express";
import { BaseController } from "./BaseController";
import { QuizSessionService } from "../services/QuizSessionService";
import { IQuizSession } from "../../common/interfaces/ToClientData";

export class QuizSessionController extends BaseController {

    protected quizSessionService: QuizSessionService;

    constructor(_quizSessionService: QuizSessionService) {
        super();
        this.quizSessionService = _quizSessionService;
    }

    private createQuizSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizSessionService.createQuizSession(req.body as IQuizSession).then((outgoingId) => {
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

    private getQuizSessionById(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizSessionService.getQuizSession(req.params.quizSessionId).then((quizSession) => {
            if (quizSession) {
                res.json({
                    session: quizSession
                });
            } else {
                res.sendStatus(400);
            }
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.put("/create", this.createQuizSession.bind(this));
        this.router.get("/quizsession/:quizSessionId", this.getQuizSessionById.bind(this));
    }
}
