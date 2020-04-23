import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";

import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import { WaitPool } from "../../queue/WaitPool";
//import { BackupClientQueue } from "../../queue/BackupClientQueue";

import { ChatGroupFormationLoop } from "../../chat/ChatGroupFormationLoop";
import { ResponseService } from "../../../services/ResponseService";
import { ChatGroupService } from "../../../services/ChatGroupService";
import { IChatGroup } from "../../../../common/interfaces/DBSchema";
import { SocketSession } from "../SocketSession";
import { UserService } from "../../../services/UserService";

const CLIENT_INDEX_OFFSET = 1;

export class ChatEndpoint extends WSEndpoint {
    private static async HandleStatusRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupStatus) {
        // Two checks, socket existence and userid allowed. Return a -1 if not allowed
        if (!SocketSession.GetSocketSessionBySocketId(socket.id)) {
            throw new Error(`Attempted to ping a response with an unknown socket ${socket.id}`);
        }

        // NOTE: implement socket authentication middleware
        const waitPool = WaitPool.GetPool(data.quizId, data.questionId);

        const output: IWSToClientData.ChatPing = {
            size: waitPool ? waitPool.getSize() : 0,
            timeout: waitPool ? waitPool.getTimeLeftBeforeForcedFormation() : -1
        };
        socket.emit("chatGroupStatusRequest", output);

    }

    private static async HandleUnJoinRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupUnJoin,  responseService: ResponseService) {
        if (!SocketSession.GetSocketSessionBySocketId(socket.id)) {
            throw new Error(`Attempted to join a group wih an unknown socket ${socket.id}`);
        }

        // Grab waitpool and hten remove
        const waitPool = WaitPool.GetPool(data.quizId, data.questionId);

        if (!waitPool) {
            throw new Error(`Invalid wait pool of ${data.quizId} ${data.questionId}`);
        }

        const response = await responseService.findOne(data.responseId);
        if (!response) {
            throw new Error(`No response of id ${data.responseId}`);
        } 

        waitPool.removeQuizAttempt(response);
    }

    private static async HandleJoinRequest(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupJoin, responseService: ResponseService,
        chatGroupService: ChatGroupService) {

        // The first check is to see if this socket exist
        if (!SocketSession.GetSocketSessionBySocketId(socket.id)) {
            throw new Error(`Attempted to join a group wih an unknown socket ${socket.id}`);
        }

        // Grabs the response 
        const userResponse = await responseService.findOne(data.responseId);

        if (!userResponse || !userResponse._id) {
            throw new Error("Attempted chat group join request with invalid quiz attempt ID = " + data.responseId);
        }

        // If an existing chat group exist, then fail it
        const existingChatGroup = await chatGroupService.findChatGroupBySessionId(data.quizSessionId);
        // Can't join into pool if already in chat group
        if (existingChatGroup) {
            throw new Error(`Attempted chat group join request while already in chat group;
                quiz session ID = ${data.quizSessionId};
                quiz ID = ${data.quizId};
                questionId = ${data.questionId}`);
        }

        // Feed in the quiz and question id
        const waitPool = await WaitPool.GetPoolWithQuestionresponse(userResponse);

        // Can't join into pool if already in pool
        if (waitPool.hasQuizResponse(userResponse)) {
            throw new Error(`Attempted chat group join request with quiz attempt already in pool;
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

                // Upon instantiation there should only be one question in the questionIds
                const chatGroup: IChatGroup = {
                    messages: [],
                    quizSessionIds: output.reduce((arr, value) => { arr.push(value.quizSessionId!); return arr; }, [] as string[]),
                    quizId: output[0].quizId,
                    startTime: Date.now()
                };

                const clientIndexDict: {[key: string]: number} = chatGroup.quizSessionIds!.reduce((acc: {[key: string]: number}, currentId, index) => {
                    acc[currentId] = index + CLIENT_INDEX_OFFSET;
                    return acc;
                }, {});

                return chatGroupService.createOne(chatGroup).then((groupId) => {
                    // Instantiate the group
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
                                // Client index is based on position in the group chat
                                // Also note chatgroup was the one formed just then
                                const clientIndex = clientIndexDict[element.quizSessionId];
                                
                                // TODO create an update group function
                                const groupFormed: IWSToClientData.ChatGroupFormed = {
                                    groupId: groupId,
                                    groupSize: chatGroup.quizSessionIds!.length,
                                    groupAnswers: output.reduce((acc: IWSToClientData.GroupAnswerDictionary, current) => {
                                        const answer: IWSToClientData.ChatGroupAnswer = {
                                            clientIndex: clientIndexDict[current.quizSessionId],
                                            answer: current
                                        }

                                        // Instantiate the array, else append if the question does not exist already
                                        if (!acc[current.questionId!]) {
                                            acc[current.questionId!] = [answer];
                                        } else {
                                            acc[current.questionId].push(answer);
                                        }
                                        return acc;
                                    }, {}),
                                    clientIndex,
                                    quizSessionId: element.quizSessionId
                                }

                                socket.emit("chatGroupFormed", groupFormed);
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
        /*const backupClientQueue = BackupClientQueue.GetQueueWithQuizScheduleFrom(quizAttempt);

        if (backupClientQueue) {
            backupClientQueue.broadcastWaitPoolCount();
        }*/
    }

    private static async HandleTypingNotification(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupTypingNotification,
            chatGroupService: ChatGroupService) {
        /*const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted chat group typing notification with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const chatGroup = ChatGroup.GetWithQuizAttempt(quizAttempt);

        if (!chatGroup) {
            return console.error("Could not find chat group for quiz attempt ID = " + data.quizAttemptId);
        }

        chatGroup.setTypingState(quizAttempt, data.isTyping);*/

        // Get group, get socket. Broadcast message

        const group = SocketSession.GetAutoCreateGroup(data.groupId);

        const chatGroup = await chatGroupService.findOne(data.groupId);

        if (!chatGroup) {
            throw Error(`Invalid chat group of id ${data.groupId}`);
        }

        // Set the typing state
        SocketSession.SetSessionTypingState(data.quizSessionId, data.isTyping);

        group.forEach((socketSession) => {
            const sock = socketSession.getSocket();

            if (sock) {

                const chatGroupTyping: IWSToClientData.ChatGroupTypingNotification = {
                    clientIndicies: SocketSession.GetTypingStatesForGroup(data.groupId)
                };
                sock.emit("chatGroupTypingNotification", chatGroupTyping);
            } else {
                console.error("Could not retrieve sock");
            }
        });

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

    // The idea is based on the group id, broadcast the messaage to everyone
    private static async HandleMessage(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupSendMessage,
            chatGroupService: ChatGroupService) {
        const group = SocketSession.GetAutoCreateGroup(data.groupId);

        const chatGroup = await chatGroupService.findOne(data.groupId);

        if (!chatGroup) {
            throw Error(`Invalid chat group of id ${data.groupId}`);
        }

        group.forEach((socketSession) => {
            const sock = socketSession.getSocket();

            if (sock) {
                const clientIndex = chatGroup.quizSessionIds!.findIndex((sessionId) => { 
                    return data.quizSessionId === sessionId
                }) + CLIENT_INDEX_OFFSET;

                // Bad index, most likely due to quiz session not existing
                if (clientIndex !== 0) {
                    const chatGroupMessage: IWSToClientData.ChatGroupMessage = {
                        message: data.message,
                        clientIndex,
                        timestamp: Date.now()
                    };
                    sock.emit("chatGroupMessage", chatGroupMessage);
                }

            } else {
                console.error("Could not retrieve sock");
            }
        });

        chatGroupService.appendChatMessageToGroup(chatGroup, data.message, data.quizSessionId, data.questionId);
    }

    private static async HandleChatReconnect(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupReconnect,
        chatGroupService: ChatGroupService) {
        const group = SocketSession.GetAutoCreateGroup(data.groupId);

        const chatGroup = await chatGroupService.findOne(data.groupId);

        if (!chatGroup) {
            throw Error(`Invalid chat group of id ${data.groupId}`);
        }

        group.forEach((socketSession) => {
            const sock = socketSession.getSocket();

            if (sock) {
                const clientIndex = chatGroup.quizSessionIds!.findIndex((sessionId) => { 
                    return data.quizSessionId === sessionId
                }) + CLIENT_INDEX_OFFSET;

                const chatGroupMessage: IWSToClientData.ChatGroupReconnect = {
                    clientIndex
                };
                sock.emit("chatGroupReconnect", chatGroupMessage);
            } else {
                console.error("Could not retrieve sock");
            }
        });
    }    

    private static async HandleDisconnect(socket: PacSeqSocket_Server, chatGroupService: ChatGroupService) {
        // Because we have no way of figuring out how the socket is stored
        // our options are simply iterate through the entire map of the socket
        const socketSession = SocketSession.GetSocketSessionBySocketId(socket.id);

        if (socketSession) {

            const group = await chatGroupService.findChatGroupBySessionId(socketSession.getQuizSessionId());

            if (group) {
                const socketGroup = SocketSession.GetGroup(group._id!);

                if (socketGroup) {
                    const clientIndex = group.quizSessionIds!.findIndex((element) => {
                        return element === socketSession.getQuizSessionId();
                    });

                    // Remember not to emit to the disconnected socket
                    socketGroup.forEach((element) => {
                        const sock = element.getSocket();
                        if (sock && sock.id !== socket.id) {

                            const disconnectMessage: IWSToClientData.ChatGroupDisconnect = {
                                clientIndex: clientIndex + CLIENT_INDEX_OFFSET
                            }

                            sock.emit("chatGroupDisconnect", disconnectMessage);
                        }
                    });
                    
                    //socketSession.destroyInstance(group._id!);
                } else {
                    console.error(`Could not find socket sesssion group when disconnecting with id ${socket.id}
                        quizSession ${socketSession.getQuizSessionId()} group id:${group._id}`);
                }

            } else {
                console.error(`Could not find chat group in db when disconnecting with id ${socketSession.getQuizSessionId()}`);
            }
        } else {
            console.error(`Could not find socket sesssion when disconnecting with id ${socket.id}`);
        }

        // The socket is safe to remove but the session itself is not as we do not know if they are coming back
        PacSeqSocket_Server.Destroy(socket);
    }


    private static async HandleGroupUpdate(socket: PacSeqSocket_Server, data: IWSToServerData.ChatGroupUpdateResponse,
        responseService: ResponseService, chatGroupService: ChatGroupService) {
        const group = SocketSession.GetAutoCreateGroup(data.groupId);

        const chatGroup = await chatGroupService.findOne(data.groupId);

        if (!chatGroup) {
            throw Error(`Invalid chat group of id ${data.groupId}`);
        }

        // Grab the response 
        const response = await responseService.findOne(data.responseId);

        
        if (!response) {
            throw Error(`Invalid response of id ${data.responseId}`);
        }

        delete response.confidence;
        delete response.quizSessionId;
        delete response.quizId;
        delete response.type;

        const responderIndex = chatGroup.quizSessionIds!.findIndex((sessionId) => { 
            return data.quizSessionId === sessionId
        }) + CLIENT_INDEX_OFFSET;

        group.forEach((socketSession) => {
            const sock = socketSession.getSocket();

            if (sock) {
                // Delete sensitive information such as confidence and quiz session id
                // The id of the response doesn't need

                const chatGroupUpdate: IWSToClientData.UserResponseUpdate = {
                    response: response,
                    responderIndex
                };
                sock.emit("chatGroupUpdate", chatGroupUpdate);
            } else {
                console.error("Could not retrieve sock");
            }
        });
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

    public get onUnJoinRequest() {
        return (data: IWSToServerData.ChatGroupUnJoin) => {
            ChatEndpoint.HandleUnJoinRequest(this.getSocket(), data, this.responseService);
        }
    }

    public get onJoinRequest() {
        return (data: IWSToServerData.ChatGroupJoin) => {
            ChatEndpoint.HandleJoinRequest(this.getSocket(), data, this.responseService, this.chatGroupService).then(() => {
                // Returns whether or not the request was successful
                return true;
            }).catch((e: Error) => {
                // Something bad happened, notify the user
                console.log(e);
                this.getSocket().emit("err", {
                    reason: "Chat formation failed"
                })
                return false;
            });
        };
    }

    public get onHandleGroupUpdate() {
        return (data: IWSToServerData.ChatGroupUpdateResponse) => {
            ChatEndpoint.HandleGroupUpdate(this.getSocket(), data, this.responseService, this.chatGroupService);
        }
    }

    public get onTypingNotification() {
        return (data: IWSToServerData.ChatGroupTypingNotification) => {
            ChatEndpoint.HandleTypingNotification(this.getSocket(), data, this.chatGroupService);
        };
    }

    public get onQuitStatusChange() {
        return (data: IWSToServerData.ChatGroupQuitStatusChange) => {
            ChatEndpoint.HandleQuitStatusChange(this.getSocket(), data);
        }
    }

    public get onMessage() {
        return (data: IWSToServerData.ChatGroupSendMessage) => {
            ChatEndpoint.HandleMessage(this.getSocket(), data, this.chatGroupService)
                .catch((e: Error) => console.error(e));
        }
    }

    public get onChatDisconnect() {
        return () => {
            ChatEndpoint.HandleDisconnect(this.getSocket(), this.chatGroupService);
        }
    }

    public get onChatReconnect() {
        return (data: IWSToServerData.ChatGroupReconnect) => {
            ChatEndpoint.HandleChatReconnect(this.getSocket(), data, this.chatGroupService);
        }
    }

    public get onStatusRequest() {
        return (data:IWSToServerData.ChatGroupStatus) => {
            ChatEndpoint.HandleStatusRequest(this.getSocket(), data);
        }
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "chatGroupJoinRequest": return this.onJoinRequest;
            case "chatGroupTypingNotification": return this.onTypingNotification;
            case "chatGroupQuitStatusChange": return this.onQuitStatusChange;
            case "chatGroupMessage": return this.onMessage;
            case "chatGroupUpdate": return this.onHandleGroupUpdate;
            case "chatGroupReconnect": return this.onChatReconnect;
            case "disconnect": return this.onChatDisconnect;
            case "chatGroupStatusRequest": return this.onStatusRequest;
            case "chatGroupUnJoinRequest": return this.onUnJoinRequest;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "chatGroupJoinRequest",
            "chatGroupTypingNotification",
            "chatGroupQuitStatusChange",
            "chatGroupMessage",
            "chatGroupStatusRequest",
            "chatGroupUpdate",
            // Note that the reason for also registering this event listener
            // is to allow disconnect messages to be sent to other users
            "chatGroupReconnect",
            "disconnect",
            "chatGroupUnJoinRequest"
        ]);
    }
}