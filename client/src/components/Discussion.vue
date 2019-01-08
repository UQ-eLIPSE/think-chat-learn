<template>
    <div id="container">
        <h1>Chat Page</h1>
        <div class="div-body">
            <p>Arbitrary filler text for question </p>
            <p>Put some answer here: <input type="text"/></p>
            <p>Put some confidence value here</p>
        </div>
        <div id="chatBody">
        </div>
        <button type="button" @click="sendJoin">Send A Join Request</button>
    </div>
</template>

<style scoped>

</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz, IUserSession, IQuizSession, Response, QuestionType } from "../../../common/interfaces/DBSchema";


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

    // Based on the quetions within the quiz?

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

        this.socket.once<IWSToClientData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, callback);
        //5c343da8da750ec31e0bad64
        //5c343da5da750ec31e0bad63
        this.socket.emitData<IWSToServerData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
            quizId: this.quiz!._id!,
            questionId: this.quiz!.pages![0]._id!,
            quizSessionId: this.quizSession!._id!,
            responseId: this.response!._id!
        });
    }

    // Requests for a creation of a session. Handles both the HTTP request and the socket
    private createSessionInServer() {
        if (this.userSession && this.quiz && this.socket) {
            // Should have passed the checks

            const outgoingQuizSession: IQuizSession = {
                quizId: this.quiz!._id,
                userSessionId: this.userSession!._id,
                responses: []
            } 

            // Instantiate the quiz session and then the socket
            this.$store.dispatch("createQuizSession", outgoingQuizSession).then((id: string) => {
                // Wait for an acknowledge?
                this.socket!.once(WebsocketEvents.INBOUND.STORE_SESSION_ACK, () => {
                });

                // Send the data
                this.socket!.emitData<IWSToServerData.StoreSession>(WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET, {
                    quizSessionId: id
                });
            });
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

    private destroy() {
        this.closeSocket();
    }
}
</script>