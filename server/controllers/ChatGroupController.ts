import * as express from "express";
import { BaseController } from "./BaseController";
import { ChatGroupService } from "../services/ChatGroupService";
import { SocketSession } from "../js/websocket/SocketSession";

export class ChatGroupController extends BaseController {

    protected chatGroupService: ChatGroupService;

    constructor(_chatGroupService: ChatGroupService) {
        super();
        this.chatGroupService = _chatGroupService;
    }

    private appendQuestion(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.chatGroupService.appendQuestionProgress(req.body.questionId, req.body.groupId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private findSession(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        const maybeSession = SocketSession.Get(req.body.quizSessionId);
        console.log(maybeSession);
        res.json({ 
            id:  maybeSession ? maybeSession.getQuizSessionId() : null
        });
    }

    public setupRoutes() {
        this.router.post("/append", this.appendQuestion.bind(this));
        this.router.post("/findSession", this.findSession.bind(this));
    }
}
