import * as express from "express";
import { BaseController } from "./BaseController";
import { ChatGroupService } from "../services/ChatGroupService";

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

    public setupRoutes() {
        this.router.post("/append", this.appendQuestion.bind(this));
    }
}
