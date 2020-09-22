import * as express from "express";
import { BaseController } from "./BaseController";
import { MarksService } from "../services/MarksService";
import { SocketSession } from "../js/websocket/SocketSession";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { isAdmin } from "../js/auth/AdminPageAuth";
import { LoginResponse } from "../../common/interfaces/ToClientData";

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

    private getMarksByQuizSessionForCurrentUser(req: express.Request, res: express.Response, next: express.NextFunction | undefined): any {
        const decodedToken = req.user as LoginResponse;
        if(!decodedToken || !decodedToken.user || !decodedToken.user._id) return res.sendStatus(401);

        if (!req.params.quizSessionId) throw new Error('Parameters not supplied');

        this.marksService.getMarksForQuizSession(req.params.quizSessionId, true).then((result) => {
            
            // Filter only current user's marks
            const currentUserMarks = (result || []).filter((marksObject) => {
                if(marksObject && (marksObject.userId === decodedToken.user._id)) {
                    return true;
                }

                return false;
            });

            return res.json({ payload: currentUserMarks || [] }).status(200);
        }).catch((e) => {
            console.log(e);
            return res.sendStatus(400);
        });
    }

    private getMarksByQuizId(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {

        const quizId = req.query.q;
        const currentPage = parseInt(req.query.c);
        const perPage = parseInt(req.query.p);
        if (!quizId || !currentPage || !perPage) throw new Error('Pagination Parameters not supplied');
        this.marksService.getMarksForQuizPaginated(quizId, currentPage, perPage).then((result) => {
            res.json(result).status(200);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
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

    private async getChatGroupsUserMap(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        try {
            if(!req.params.quizId) throw new Error('Invalid request parameters');

            const result = await this.marksService.getChatGroupsUserMap(req.params.quizId);

            if(result) return res.json({
                success: true,
                payload: result
            }).status(200);

            return res.json({
                success: false
            }).status(500);
        } catch(e) {
            return res.sendStatus(500);
        }
    }
    public setupRoutes() {
        this.router.get("/bulk/quiz", isAdmin(), this.getMarksByQuizId.bind(this));
        this.router.get("/quizSessionId/:quizSessionId", isAdmin(), this.getMarksByQuizSession.bind(this));
        this.router.post("/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarks.bind(this));
        this.router.post("/multiple/createOrUpdate/quizSessionId/:quizSessionId/questionId/:questionId", isAdmin(), this.createOrUpdateMarksMultiple.bind(this));
        this.router.get('/chatGroupsUserMap/:quizId', isAdmin(), this.getChatGroupsUserMap.bind(this));
        this.router.get("/student/quizSession/:quizSessionId", StudentAuthenticatorMiddleware.checkUserId(), this.getMarksByQuizSessionForCurrentUser.bind(this));
    }
}
