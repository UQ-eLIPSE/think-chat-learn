import express from "express";
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

    private getMarksByQuizSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if (!req.params.quizSessionId) throw new Error('Parameters not supplied');

        this.marksService.getMarksForQuizSession(req.params.quizSessionId).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private getMarksByQuizId(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {

        const quizId = (typeof req.query.q === "string")? req.query.q: null;
        const c = (typeof req.query.c === "string")? req.query.c: null;
        const p = (typeof req.query.p === "string")? req.query.p: null;
        if(!c || !p) return res.sendStatus(400);

        const currentPage = parseInt(c as string);
        const perPage = parseInt(p as string);
        if (!quizId || !currentPage || !perPage) throw new Error('Pagination Parameters not supplied');
        this.marksService.getMarksForQuizPaginated(quizId, currentPage, perPage).then((result) => {
            return res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            return res.sendStatus(400);
        });


        // Fall-through case
        return res.sendStatus(500);
    }

    private createOrUpdateMarks(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if (!req.params.quizSessionId || !req.params.questionId || !req.body) throw new Error('Parameters not supplied');
        // TODO validate req.body as a valid mark
        this.marksService.createOrUpdateMarks(req.params.quizSessionId, req.params.questionId, req.body).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private createOrUpdateMarksMultiple(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        if (!req.params.quizSessionId || !req.params.questionId || !req.body) throw new Error('Parameters not supplied');
        // TODO validate req.body as a valid mark
        this.marksService.createOrUpdateMarksMultiple(req.params.quizSessionId, req.params.questionId, req.body).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    public setupRoutes() {
        this.router.get("/bulk/quiz", isAdmin(), this.getMarksByQuizId.bind(this));
        this.router.get("/quizSessionId/:quizSessionId", isAdmin(), this.getMarksByQuizSession.bind(this));
        this.router.post("/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarks.bind(this));
        this.router.post("/multiple/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarksMultiple.bind(this));
    }
}
