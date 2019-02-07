import * as express from "express";
import { BaseController } from "./BaseController";
import { QuizSessionService } from "../services/QuizSessionService";
import { IQuizSession } from "../../common/interfaces/ToClientData";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { SocketSession } from "../js/websocket/SocketSession";

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

    // This checks whether or not a socket session still exists for a given quiz session
    private findSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        const maybeSession = SocketSession.Get(req.body.quizSessionId);
        res.json({ 
            outcome:  maybeSession ? true : false
        });
    }    

    private getQuizSessionByUserIdAndQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        const request: { userId: string, quizId: string } = req.body;
        this.quizSessionService.getQuizSessionbyUserQuiz(request.userId, request.quizId).then((data) => {
            res.json({
                data
            });
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    public setupRoutes() {
        this.router.put("/create", StudentAuthenticatorMiddleware.checkUserId(), StudentAuthenticatorMiddleware.checkQuizSessionId(), this.createQuizSession.bind(this));
        this.router.get("/quizsession/:quizSessionId", StudentAuthenticatorMiddleware.checkUserId(), this.getQuizSessionById.bind(this));
        this.router.post("/findSession", this.findSession.bind(this));
        this.router.post("/fetchByUserQuiz", this.getQuizSessionByUserIdAndQuiz.bind(this));
    }
}
