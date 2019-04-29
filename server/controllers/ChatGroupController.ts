import * as express from "express";
import { BaseController } from "./BaseController";
import { ChatGroupService } from "../services/ChatGroupService";
import { SocketSession } from "../js/websocket/SocketSession";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { isAdmin } from "../js/auth/AdminPageAuth";

export class ChatGroupController extends BaseController {

    protected chatGroupService: ChatGroupService;

    constructor(_chatGroupService: ChatGroupService) {
        super();
        this.chatGroupService = _chatGroupService;
    }

    private recoverChatGroupStateByQuizSessionId(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.chatGroupService.reconstructChatGroup(req.body._id).then((data) => {
            res.json(data);
        }).catch((e) => {
            console.log(e);
            res.sendStatus(400);
        });
    }

    private getChatGroups(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.chatGroupService.getChatGroups(req.query.quizid).then((result) => {
            res.json(result);
        }).catch((e) => {
            res.sendStatus(400);
        });
    }

    public setupRoutes() {
        this.router.post("/recoverSession", StudentAuthenticatorMiddleware.checkUserId(),
            StudentAuthenticatorMiddleware.checkQuizSessionId(), this.recoverChatGroupStateByQuizSessionId.bind(this));
        this.router.get('/getChatGroups', isAdmin(), this.getChatGroups.bind(this));
    }
}
