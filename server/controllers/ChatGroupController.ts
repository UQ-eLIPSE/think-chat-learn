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

    private findGroupByQuizSessionId(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.chatGroupService.findChatGroupBySessionId(req.body.quizSessionId).then((data) => {
            res.json({
                data
            })
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private recoverChatGroupStateByQuizSessionId(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.chatGroupService.reconstructChatGroup(req.body.quizSessionId).then((data) => {
            res.json(data);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    public setupRoutes() {
        this.router.post("/recoverSession", this.recoverChatGroupStateByQuizSessionId.bind(this));
        this.router.post("/findSession", this.findGroupByQuizSessionId.bind(this));
    }
}
