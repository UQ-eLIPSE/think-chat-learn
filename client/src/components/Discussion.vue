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
    </div>
</template>

<style scoped>

</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz } from "../../../common/interfaces/DBSchema";


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
        //5c32e50dda750ec31e0bad62
        this.socket.emitData<IWSToServerData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
            quizId: this.quiz!._id!,
            questionId: this.quiz!.pages![0]._id!,
            quizSessionId: "55",
            responseId: "5c32e50dda750ec31e0bad62"
        });
    }

    private mounted() {
        // Attempt to join the chat. Also instantiate the socket
        if (this.quiz && !this.socket) {
            this.createSocket();
            this.emitJoinRequest((data) => {
            });
        }
    }

    private destroy() {
        this.closeSocket();
    }
}
</script>