import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import { MoocchatWaitPool } from "../../queue/MoocchatWaitPool";
//import { MoocchatBackupClientQueue } from "../../queue/MoocchatBackupClientQueue";

import { ChatGroup } from "../../chat/ChatGroup";
import { ChatMessage } from "../../chat/ChatMessage";

import { ChatGroupFormationLoop } from "../../chat/ChatGroupFormationLoop";
import { ResponseService } from "../../../services/ResponseService";
import { ChatGroupService } from "../../../services/ChatGroupService";
import { IChatGroup } from "../../../../common/interfaces/DBSchema";
import { SocketSession } from "../SocketSession";

export class ChatEndpoint extends WSEndpoint {
    private static async HandleJoinRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupJoin, responseService: ResponseService,
        chatGroupService: ChatGroupService) {

        // Grabs the response 
        const userResponse = await responseService.getResponse(data.responseId);

        if (!userResponse || !userResponse._id) {
            return console.error("Attempted chat group join request with invalid quiz attempt ID = " + data.responseId);
        }

        // If an existing chat group exist, then fail it
        const existingChatGroup = await chatGroupService.findChatGroupsBySessionQuizQuestion(data.quizSessionId, data.quizId, data.questionId);

        // Can't join into pool if already in chat group
        if (existingChatGroup.length) {
            return console.error(`Attempted chat group join request while already in chat group;
                quiz session ID = ${data.quizSessionId};
                quiz ID = ${data.quizId};
                questionId = ${data.questionId}`);
        }

        // Feed in the quiz and question id
        const waitPool = MoocchatWaitPool.GetPoolWithQuestionresponse(userResponse);

        // Can't join into pool if already in pool
        if (waitPool.hasQuizResponse(userResponse)) {
            return console.error(`Attempted chat group join request with quiz attempt already in pool;
                quiz session ID = ${data.quizSessionId};
                quiz ID = ${data.quizId};
                questionId = ${data.questionId}`);
        }

        // Add quiz attempt into wait pool
        waitPool.addQuizAttempt(userResponse);


        // Run the chat group formation loop now
        const cgfl = ChatGroupFormationLoop.GetChatGroupFormationLoop(waitPool);

        // Politely ask for the loop to start. If it has not started, remember to set up the function
        // when the group has been formed.
        if (!cgfl.hasStarted) {
            cgfl.registerOnGroupCoalesced((output) => {

                // Create the group, note that we just need to grab
                // one instance of the responses and use their quiz and question ids
                
                if (!output.length) {
                    throw Error("Somehow a 0 length group was formed");
                }

                const chatGroup: IChatGroup = {
                    messages: [],
                    quizSessionIds: output.reduce((arr, value) => { arr.push(value._id!); return arr; }, [] as string[]),
                    quizId: output[0].quizId,
                    questionId: output[0].questionId
                };

                chatGroupService.createChatGroup(chatGroup).then((groupId) => {
                    // Instantiate the croup
                    SocketSession.CreateGroup(groupId)

                    // Grab the associated sockets and emit
                    output.forEach((element) => {
                        // Place in the group
                        SocketSession.PutInGroup(groupId, element.quizSessionId);

                        // Grab the socket 
                        const maybeSession = SocketSession.Get(element.quizSessionId);
                        if (maybeSession) {
                            const socket = maybeSession.getSocket();
                            if (socket) {
                                // TODO fix the hard code answers and client index
                                socket.emit("chatGroupFormed", {
                                    groupId: groupId,
                                    groupSize: chatGroup.quizSessionIds!.length,
                                    groupAnswers: [],
                                    clientIndex: 5})
                            } else {
                                console.error("no socket");
                            }
                        } else {
                            console.error("invalid session");
                        }
                    });
                });
            });
            cgfl.start();
        } else {
            cgfl.forceRun();
        }

        // TODO implement backupqueue

        // Update backup queue
        /*const backupClientQueue = MoocchatBackupClientQueue.GetQueueWithQuizScheduleFrom(quizAttempt);

        if (backupClientQueue) {
            backupClientQueue.broadcastWaitPoolCount();
        }*/
    }

    private static HandleTypingNotification(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupTypingNotification) {
        /*const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group typing notification with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        chatGroup.setTypingState(quizAttempt, data.isTyping);*/
    }

    private static HandleQuitStatusChange(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupQuitStatusChange) {
        /*const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group typing notification with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        if (data.quitStatus) {
            chatGroup.quitQuizAttempt(quizAttempt);
        }*/
    }

    private static async HandleMessage(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupSendMessage) {
        /*const quizAttempt = this.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group message with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        //const chatMessage = await ChatMessage.Create(db, {
        //   content: data.message,
        //    timestamp: new Date(),
        //}, chatGroup, quizAttempt);

        chatGroup.broadcastMessage(quizAttempt, chatMessage.getMessage()!);*/
    }




    private responseService: ResponseService;
    private chatGroupService: ChatGroupService;
    private chatMessageService: any;

    constructor(socket: PacSeqSocket_Server, _responseService: ResponseService, _chatGroupService: ChatGroupService, _chatMessageService: any) {
        super(socket);
        this.responseService = _responseService;
        this.chatGroupService = _chatGroupService;
        this.chatMessageService = _chatMessageService;
    }

    public get onJoinRequest() {
        return (data: IWSToServerData.ChatGroupJoin) => {
            ChatEndpoint.HandleJoinRequest(this.getSocket(), data, this.responseService, this.chatGroupService).then(() => {
                // Returns whether or not the request was successful
                return true;
            }).catch((e: Error) => {
                // Something bad happened
                return false;
            });
            


        };
    }

    public get onTypingNotification() {
        return (data: IWSToServerData.ChatGroupTypingNotification) => {
            ChatEndpoint.HandleTypingNotification(this.getSocket(), data);
        };
    }

    public get onQuitStatusChange() {
        return (data: IWSToServerData.ChatGroupQuitStatusChange) => {
            ChatEndpoint.HandleQuitStatusChange(this.getSocket(), data);
        }
    }

    public get onMessage() {
        return (data: IWSToServerData.ChatGroupSendMessage) => {
            ChatEndpoint.HandleMessage(this.getSocket(), data)
                .catch(e => console.error(e));
        }
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "chatGroupJoinRequest": return this.onJoinRequest;
            case "chatGroupTypingNotification": return this.onTypingNotification;
            case "chatGroupQuitStatusChange": return this.onQuitStatusChange;
            case "chatGroupMessage": return this.onMessage;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "chatGroupJoinRequest",
            "chatGroupTypingNotification",
            "chatGroupQuitStatusChange",
            "chatGroupMessage",
        ]);
    }
}