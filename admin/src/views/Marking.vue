<template>
    <div class="marking">
        <!-- <button @click="launchMousokuElipss">Mousoku-elipss</button> -->
        <!-- <iframe id="marking-system"
                src="/server-static/mousoku-elipss/bridge.html"></iframe> -->

    </div>
</template>

<script lang="ts">
// import { Vue, Component } from "vue-property-decorator";
// import {
//     getAdminLoginResponse,
//     setIdToken,
//     decodeToken
// } from "../../../common/js/front_end_auth";
// import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";
// import { PageType } from "../../../common/enums/DBEnums";
// import { IQuiz, QuizScheduleDataAdmin, Page } from "../../../common/interfaces/ToClientData";
// import { html } from '../util/tool';

// // const bridge = require('../../static/mousoku-elipss/bridge.html');

// interface BridgePacket {
//     event: string,
//     data: any,
// }

// interface BridgeXhrRequest extends BridgePacket {
//     data: {
//         xhrId: string,  // The XHR requestor must identify their XHR request with a self-generated ID so that once the data is returned, the requestor is able to sort out what request is what
//         method: "GET" | "POST",
//         url: string,
//         data?: any,
//     }
// }

// interface BridgeXhrSuccess extends BridgePacket {
//     event: "mc_bridge_xhrSuccess",
//     data: {
//         xhrId: string,
//         textStatus: string,
//         data: any,
//     }
// }

// interface BridgeXhrFail extends BridgePacket {
//     event: "mc_bridge_xhrFail",
//     data: {
//         xhrId: string,
//         textStatus: string,
//         errorThrown: any,
//     }
// }

// interface BridgeReady extends BridgePacket {
//     data: {
//         application: {
//             name: string,
//         }
//     }
// }

// @Component
// export default class Marking extends Vue {

//     mounted() {
//         const bridgeChannel = new MessageChannel();
//         const ourPort = bridgeChannel.port1;
//         const theirPort = bridgeChannel.port2;
//         let intervalHandle = null;
//         let maxConnectTries = 1000;
    
//         let iframe = document.getElementById("marking-system") as HTMLIFrameElement;

//         ourPort.addEventListener("message", async (e) => {
//             if(e.data.event === "mc_bridge_ready") {
//                 clearInterval(intervalHandle);
//                 return;
//             }
//             const res = await this.processBridgeMessage(e);
//             if (res && iframe !== null) {
//                 theirPort.postMessage({ event: "mc_bridge_message", data: res })
//             }
//         });
        
        
//         iframe.onload = () => {
//             // Set up bridge
//             ourPort.start();

//             intervalHandle = setInterval(() => {
//                 if(maxConnectTries > 0) {
//                     iframe.contentWindow!.postMessage("mc_bridge_port", "*", [theirPort]);
//                     console.log('sending ')
//                     --maxConnectTries;
//                 }

//                 if(maxConnectTries === 0) {
//                     clearInterval(intervalHandle);
//                     alert('Could not connect via the bridge');
//                 }
                
//             }, 50);
            
//         }
        
        
        
//     }
//     processBridgeMessage(e: MessageEvent) {
//         console.log('Process b')
//         console.log(e.data);
//         const messageEventData = e.data;
//         const event = messageEventData.event;
//         const data = messageEventData.data;
//         const xhrId = data.xhrId;
//         console.log(e);
//         switch (event) {
//             case "mc_bridge_message":
//                 switch (data.message) {
//                     case "GET_ALL_QUIZZES":
//                         console.log('Asking for quizzes');
//                         const quizzes = this.$store.getters.quizzes;
//                         const questionsAsQuizzes: any[] = [];
//                         if (quizzes) {
//                             (quizzes as IQuiz[]).forEach((quiz) => {
//                                 if(!quiz) return;
//                                 (quiz.pages || []).forEach((page) => {
//                                     if (page.type === PageType.QUESTION_ANSWER_PAGE) {
//                                         questionsAsQuizzes.push({
//                                             _id: quiz._id,
//                                             questionId: page._id,
//                                             course: quiz.course,
//                                             availableStart: quiz.availableStart,
//                                             availableEnd: quiz.availableEnd
//                                         })
//                                     }
//                                 });

//                             });

//                         }
//                         console.log('Returning array of questions as quizzes');
//                         console.log(questionsAsQuizzes);
//                         return { success: true, xhrId: xhrId, data: questionsAsQuizzes };
//                     case "GET_ALL_QUESTIONS":
//                         // const questions = 
//                         break;
//                     case "GET_CHAT_MESSAGES_OF_QUIZ":
//                         // Get chat messages for that question
//                         break;
//                     default:
//                         console.log('Received message');
//                 }

//                 break;

//             default: break;
//         }
//     }




    // launchMousokuElipss() {
    //     const bridgeChannel = new MessageChannel();
    //     const ourPort = bridgeChannel.port1;
    //     const theirPort = bridgeChannel.port2;



    //     const markingWindow = window.open("", undefined, "menubar=0,toolbar=0,location=0,personalbar=0,directories=0,status=0,resizable=1,scrollbars=0");
    //     if (markingWindow === null) {
    //         alert('Marking window could not be launched');
    //         return;
    //     }

    //     // Prevent leaking opener
    //     markingWindow.opener = null;

    //     let applicationName: string | undefined;
    //     // let $warning: JQuery | undefined;

    //     const sendPort = () => {
    //         markingWindow.postMessage("mc_bridge_port", "*", [theirPort]);
    //         markingWindow.removeEventListener("load", sendPort);
    //     }
    //     const warnBridgeActiveOnBeforeUnload = (e: BeforeUnloadEvent) => {
    //         var message = `Application "${applicationName}" is currently using MOOCchat Bridge. If you exit now, "${applicationName}" will be unable to continue functioning.`;

    //         e.returnValue = message;
    //         return message;
    //     }

    //     const closeBridge = () => {
    //         // Close the bridge, clean up, enable window to move on
    //         window.removeEventListener("beforeunload", warnBridgeActiveOnBeforeUnload);
    //         ourPort.removeEventListener("message", this.processBridgeMessage);
    //         ourPort.close();

    //         // if ($warning) {
    //         //     $warning.remove();
    //         // }
    //     }

    //     const processBridgeMessage = (e: MessageEvent) => {
    //         const packet: BridgePacket = e.data;

    //         switch (packet.event) {
    //             case "mc_bridge_ready": {
    //                 const _packet: BridgeReady = packet;
    //                 const data = _packet.data;

    //                 // Set application name
    //                 applicationName = data.application.name;

    //                 // Display warning over page
    //                 // $warning = $("<div>")
    //                 //     .addClass("mc-full-screen-msg-container")
    //                 //     .append([
    //                 //         $("<div>")
    //                 //             .append([
    //                 //                 $("<h1>").text(`"${applicationName}" is currently using MOOCchat Bridge`),
    //                 //                 $("<p>").text(`If you exit now, "${applicationName}" will be unable to continue functioning.`),
    //                 //                 $("<p>").text(`To close MOOCchat Bridge, return to "${applicationName}" and exit the application normally.`),
    //                 //                 $("<button>").text("Force close MOOCchat Bridge").one("click", closeBridge),
    //                 //             ])
    //                 //     ]);

    //                 // $("body").append($warning);

    //                 // Warn when leaving
    //                 window.addEventListener("beforeunload", warnBridgeActiveOnBeforeUnload);

    //                 return;
    //             }

    //             case "mc_bridge_close": {
    //                 closeBridge();
    //                 return;
    //             }

    //             case "mc_bridge_xhrRequest": {
    //                 const _packet: BridgeXhrRequest = packet;
    //                 const data = _packet.data;

    //                 const xhrId = data.xhrId;

    //                 // let xhr: JQueryXHR;

    //                 switch (data.method) {
    //                     case "GET": {

    //                         // xhr = this.ajaxFuncs!.get(data.url).xhr;
    //                         break;
    //                     }

    //                     case "POST": {
    //                         // xhr = this.ajaxFuncs!.post(data.url, data.data).xhr;
    //                         break;
    //                     }

    //                     default: {
    //                         break;
    //                         // return this.dispatchError(new Error(`Unrecognised method ${data.method}`));
    //                     }
    //                 }

    //                 // xhr
    //                 //     .done((data, textStatus) => {
    //                 //         const packet: BridgeXhrSuccess = {
    //                 //             event: "mc_bridge_xhrSuccess",
    //                 //             data: {
    //                 //                 xhrId,
    //                 //                 textStatus,
    //                 //                 data,
    //                 //             },
    //                 //         }

    //                 //         ourPort.postMessage(packet);
    //                 //     })
    //                 //     .fail((_jqXhr, textStatus, errorThrown) => {
    //                 //         const packet: BridgeXhrFail = {
    //                 //             event: "mc_bridge_xhrFail",
    //                 //             data: {
    //                 //                 xhrId,
    //                 //                 textStatus,
    //                 //                 errorThrown,
    //                 //             },
    //                 //         }

    //                 //         ourPort.postMessage(packet);
    //                 //     });

    //                 return;
    //             }
    //         }

    //         console.log(e);
    //     }

    //     // Listen over the bridge via. the set port
    //     ourPort.addEventListener("message", processBridgeMessage);

    //     // Ports must be 'started' when using #addEventListener()
    //     ourPort.start();

    //     let url = '/marking-tool';
    //     // Go to page
    //     markingWindow.location.assign(url);

    //     // Workaround: IE/Edge doesn't fire load event?
    //     // Check window.name for port request
    //     let windowNameCheckMaxTries = 500;  // 25s
    //     const windowNameCheckHandle: number = setInterval(() => {
    //         if (markingWindow.name === "mc_bridge_port_request") {
    //             sendPort();
    //             return clearInterval(windowNameCheckHandle);
    //         }

    //         if (--windowNameCheckMaxTries === 0) {
    //             alert(`Bridge application at "${url}" failed to connect to MOOCchat`);
    //             clearInterval(windowNameCheckHandle);
    //         }
    //     }, 50);


    // }
// }
</script>

<style lang="css">
.marking {
    width: calc(90% - 18rem);
    height: 100%;
}
#marking-system {
    width: 100%;
    height: 100%;
}

</style>