import express from "express";
import { BaseController } from "./BaseController";
import { ChatGroupService } from "../services/ChatGroupService";
import { SocketSession } from "../js/websocket/SocketSession";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
import { isAdmin } from "../js/auth/AdminPageAuth";
import { LoginResponse, AdminLoginResponse } from "../../common/interfaces/ToClientData";
import { uniqueId } from "lodash";

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

    private async getChatGroups(req: express.Request, res: express.Response, next: express.NextFunction | undefined): Promise<express.Response> {
        try {
            const decodedToken = req.user as AdminLoginResponse;
            const userId = (decodedToken && decodedToken.user && decodedToken.user._id) || null;
            if(!userId) throw new Error('Invalid user credentials');
            const quizId = req.query.quizid;

            if(!quizId) throw new Error("Quiz ID not provided");

            const chatGroups = await this.chatGroupService.getMinifiedChatGroupsWithMarkingData(quizId as any, userId);

            return res.json({
                success: true,
                payload: chatGroups
            }).status(200);
        } catch(e) {
            return res.json({
                success: false
            }).status(500);
        }
    }

    /**
     * Verifies that a quiz session ID belongs to requesting userId
     * If successful, returns chat group after stripping out any identifiable information about the chat messages (other than the user's own messages)
     * @param req 
     * @param res 
     * @param next 
     */
    private async getChatGroupForQuizSessionForClient(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        try {
            const decodedToken = req.user as LoginResponse;
            const quizSessionId = req.params.quizSessionId;
    
            if(!decodedToken || !quizSessionId || !decodedToken.user || !decodedToken.user._id) return res.sendStatus(500);
            const chatGroup = await this.chatGroupService.getChatGroupByQuizSessionIdAndUser(quizSessionId, decodedToken.user._id);
            
            
            if(!chatGroup) throw new Error('Chat group not found for quiz session');
            
            const realToFakeQuizSessionMap: {[key: string]: string} = {};

            // Replace all quiz session id's other than the user's own quiz session id with fake unusable ids
            (chatGroup.quizSessionIds || []).forEach((sessionId, i) => {
                if(sessionId !== quizSessionId) {
                    // replace with dummy id
                    const dummyId = uniqueId(`TCL_SESS_${Date.now()}_`);
                    realToFakeQuizSessionMap[sessionId] = dummyId;
                    chatGroup!.quizSessionIds![i] = dummyId;
                }
            });

            // Replace all chat message quiz session IDs
            (chatGroup.messages || []).forEach((message, i) => {
                if(!message) return;
                if(message.quizSessionId !== quizSessionId) {
                    // replace with dummy id
                    message.quizSessionId = realToFakeQuizSessionMap[message.quizSessionId] || uniqueId('TCL_SESS');
                }
            });

            return res.json({
                success: true,
                payload: chatGroup
            });
        } catch(e) {
            return res.json({
                success: false
            }).status(500);
        }
    }

    private async getMessagesByChatGroupId(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        try {
            const chatGroupId = req.params.chatGroupId;
            if(!chatGroupId) throw new Error('Invalid parameters: chatGroupId missing');

            const messages = await this.chatGroupService.getMessagesByChatGroupId(chatGroupId);

            return res.json({
                success: true,
                payload: messages
            });
        } catch(e) {
            console.error(e);
            return res.json({
                success: false
            }).status(500);
        }
    }

    public setupRoutes() {
        this.router.post("/recoverSession", StudentAuthenticatorMiddleware.checkUserId(),
            StudentAuthenticatorMiddleware.checkQuizSessionId(), this.recoverChatGroupStateByQuizSessionId.bind(this));
        this.router.get('/getChatGroups', isAdmin(), this.getChatGroups.bind(this));
        this.router.get('/quizSession/:quizSessionId', StudentAuthenticatorMiddleware.checkUserId(), this.getChatGroupForQuizSessionForClient.bind(this));
        this.router.get('/:chatGroupId/messages', isAdmin(), this.getMessagesByChatGroupId.bind(this));
    }
}
