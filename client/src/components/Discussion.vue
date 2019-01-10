<template>
    <div id="container">
        <h1>Chat Page</h1>
        <div class="div-body">
            <p>Arbitrary filler text for question </p>
            <p>Put some answer here: <input type="text"/></p>
            <p>Put some confidence value here</p>
        </div>
        <div id="chatBody">
            <p v-for="(message, index) in messages" :key="index">{{message}}</p>
        </div>
        <div id="typingBody">
            <!-- Note the client index itself should be unique. Worst case we use the actual though if there is a duplication -->
            <p v-for="(clientIndex, index) in typingUserIndices" :key="index">Client {{clientIndex}} is typing</p>
        </div>
        <input v-model="loadedMessage" @focus="sendTypingState(true)" @blur="sendTypingState(false)" type="text"/>
        <button type="button" @click="sendJoin">Send A Join Request</button>
        <button type="button" @click="sendMessage">Sends A Message</button>

    </div>
</template>

<style scoped>

</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz, IUserSession, IQuizSession, Response } from "../../../common/interfaces/ToClientData";
import { QuestionType } from "../../../common/enums/DBEnums";


// Websocket interfaces
import io from "socket.io-client";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { WebsocketManager } from "../../js/WebsocketManager";
import { PacSeqSocket_Client } from "../../../common/js/PacSeqSocket_Client";
import { WebsocketEvents } from "../../js/WebsocketEvents";

@Component({})
export default class Discussion extends Vue {

    private socket: WebsocketManager | null = null;
    private groupId: string | null = null;
    private messages: string[] = [];
    private loadedMessage: string = "";
    private selfClientIndex: number | null = null;
    private typingUserIndices: number[] = [];

    // Based on the quiz
    get quiz(): IQuiz | null {
        return this.$store.getters.quiz;
    }

    // Based on stored user details
    get userSession(): IUserSession | null {
        return this.$store.getters.userSession;
    }

    // Gets the quizSession
    get quizSession(): IQuizSession | null {
        return this.$store.getters.quizSession;
    }

    // Gets the response
    get response(): Response {
        return this.$store.getters.response;
    }

    // Creates the socket for working
    private createSocket() {
        this.socket = new WebsocketManager();
    }

    // Tidies up the socket business 
    private closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }

    // Sends a join request to the server. Once completed, runs the callback to instantiate an actual textbox
    private emitJoinRequest(callback: (data?: IWSToClientData.ChatGroupFormed) => void) {
        if (!this.socket || !this.quiz) {
            throw Error("Sent a join request without a socket or quiz");
        }

        this.socket.emitData<IWSToServerData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
            quizId: this.quiz!._id!,
            questionId: this.quiz!.pages![0]._id!,
            quizSessionId: this.quizSession!._id!,
            responseId: this.response!._id!
        });
    }

    // Requests for a creation of a session. Handles both the HTTP request and the socket
    private createSessionInServer() {
        if (this.userSession && this.quiz && this.socket && !this.quizSession) {
            // Should have passed the checks

            const outgoingQuizSession: IQuizSession = {
                quizId: this.quiz!._id,
                userSessionId: this.userSession!._id,
                responses: []
            } 

            // Instantiate the quiz session and then the socket
            this.$store.dispatch("createQuizSession", outgoingQuizSession).then((id: string) => {

                // Register the on events
                this.registerSocketEvents();

                // Send the data
                this.socket!.emitData<IWSToServerData.StoreSession>(WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET, {
                    quizSessionId: this.quizSession!._id!
                });
            });
        }
    }

    // Registers all the socket events that will be used
    private registerSocketEvents() {
        
        // Wait for an acknowledge?
        this.socket!.once(WebsocketEvents.INBOUND.STORE_SESSION_ACK, () => {
        });

        // Handle group formation
        this.socket!.once<IWSToClientData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, this.handleGroupJoin);

        // Handle chat logs
        this.socket!.on<IWSToClientData.ChatGroupMessage>(WebsocketEvents.INBOUND.CHAT_GROUP_RECEIVE_MESSAGE,
            this.handleIncomingChatMessage);

        // Handle typing states
        this.socket!.on<IWSToClientData.ChatGroupTypingNotification>(WebsocketEvents.INBOUND.CHAT_GROUP_TYPING_NOTIFICATION,
            this.handleTypingNotification);

    }

    private handleTypingNotification(data?: IWSToClientData.ChatGroupTypingNotification) {
        if (!data) {
            throw Error("No data for typing notifications");
        }

        this.typingUserIndices = data.clientIndicies;
    }

    private handleGroupJoin(data?: IWSToClientData.ChatGroupFormed) {
        if (!data) {
            throw Error("No data received when handling a message");
        }

        this.groupId = data.groupId;
    }

    private handleIncomingChatMessage(data?: IWSToClientData.ChatGroupMessage) {
        if (!data) {
            throw Error("No data received when handling a message");
        }

        this.messages.push(data.message);
    }

    // Sends the typing state to the listening sockets to the group, including self!
    private sendTypingState(state: boolean) {
        if (this.quiz && this.quizSession && this.response && this.socket) {
            const output: IWSToServerData.ChatGroupTypingNotification = {
                isTyping: state,
                quizId: this.quiz!._id!,
                questionId: this.quiz!.pages![0]._id!,
                quizSessionId: this.quizSession!._id!,
                responseId: this.response!._id!,
                groupId: this.groupId!            
            };

            this.socket!.emitData<IWSToServerData.ChatGroupTypingNotification>(WebsocketEvents.OUTBOUND.CHAT_GROUP_TYPING_NOTIFICATION
                ,output);
        }
    }

    private mounted() {
        // Attempt to join the chat. Also instantiate the socket
        if (this.quiz && !this.socket) {
            // Instantitates a socket and then sends a reqest
            this.createSocket();
            this.createSessionInServer();
        }
    }

    private async sendJoin() {
        // Send dummy data in first
        const outgoingResponse: Response = {
            type: QuestionType.QUALITATIVE,
            confidence: 5,
            questionId: "PizzaHut",
            quizId: "Dominos",
            content: "DOTA",
            quizSessionId: this.quizSession!._id!
        }
        await this.$store.dispatch("sendResponse", outgoingResponse);

        // Sends a join request
        this.emitJoinRequest((data) => {
        });        
    }

    private sendMessage() {
        // Sends a message to the server. Note that we do not preload messages (as in push local messages to itself immediately)
        const message: IWSToServerData.ChatGroupSendMessage = {
            message: this.loadedMessage,
            groupId: this.groupId!,
            quizId: this.quiz!._id!,
            questionId: this.quiz!.pages![0]._id!,
            quizSessionId: this.quizSession!._id!,
            responseId: this.response!._id!
        };

        if (!this.socket || !this.quiz) {
            throw Error("Sent a join request without a socket or quiz");
        }

        this.socket!.emitData<IWSToServerData.ChatGroupSendMessage>(WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, message);
    }

    private destroy() {
        this.closeSocket();
    }
}
</script>