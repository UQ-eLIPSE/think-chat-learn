import * as express from "express";
import { BaseController } from "./BaseController";
import { MarksService } from "../services/MarksService";
import { SocketSession } from "../js/websocket/SocketSession";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { isAdmin } from "../js/auth/AdminPageAuth";

export class MarksController extends BaseController {

    protected marksService: MarksService;

    constructor(_marksService: MarksService) {
        super();
        this.marksService = _marksService;
    }


    private getMarksByQuizSessionQuestion(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        console.log('params: ', req.params);
        if(!req.params.quizSessionId || !req.params.questionId) throw new Error('Parameters not supplied');

        this.marksService.getMarksForQuizSessionQuestion(req.params.quizSessionId, req.params.questionId).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private getMarksByQuizSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if(!req.params.quizSessionId) throw new Error('Parameters not supplied');

        this.marksService.getMarksForQuizSessionQuestion(req.query.quizSessionId).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private createOrUpdateMarks(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if(!req.params.quizSessionId || !req.params.questionId || !req.body) throw new Error('Parameters not supplied');
        // TODO validate req.body as a valid mark
        this.marksService.createOrUpdateMarks(req.params.quizSessionId, req.params.questionId, req.body).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private createOrUpdateMarksMultiple(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if(!req.params.quizSessionId || !req.params.questionId || !req.body) throw new Error('Parameters not supplied');
        // TODO validate req.body as a valid mark
        console.log('Request recd for multi marking');
        this.marksService.createOrUpdateMarksMultiple(req.params.quizSessionId, req.params.questionId, req.body).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    public setupRoutes() {
        this.router.get("/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.getMarksByQuizSessionQuestion.bind(this));
        this.router.get("/quizSessionId/:quizSessionId", isAdmin(), this.getMarksByQuizSession.bind(this));
        this.router.post("/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarks.bind(this));
        this.router.post("/multiple/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarksMultiple.bind(this));
    }
}
