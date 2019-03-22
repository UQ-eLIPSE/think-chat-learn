    
    
    
    // export const launchMarkingTool = (url: string) => {
    //     const bridgeChannel = new MessageChannel();
    //     const ourPort = bridgeChannel.port1;
    //     const theirPort = bridgeChannel.port2;
    //     const markingWindow = window.open("", undefined, "menubar=0,toolbar=0,location=0,personalbar=0,directories=0,status=0,resizable=1,scrollbars=0");

    //     if(markingWindow === null) {
    //         alert('Marking window could not be launched');
    //         return;
    //     }
    //     // Prevent leaking opener
    //     markingWindow.opener = null;

    //     let applicationName: string | undefined;
    //     // let $warning: JQuery | undefined;

    //     const sendPort = () => {
    //         markingWindow.postMessage("mc_bridge_port", "*", [theirPort]);
    //         // markingWindow.removeEventListener("load", sendPort);
    //     }

    //     const warnBridgeActiveOnBeforeUnload = (e: BeforeUnloadEvent) => {
    //         var message = `Application "${applicationName}" is currently using MOOCchat Bridge. If you exit now, "${applicationName}" will be unable to continue functioning.`;

    //         e.returnValue = message;
    //         return message;
    //     }

    //     const closeBridge = () => {
    //         // Close the bridge, clean up, enable window to move on
    //         window.removeEventListener("beforeunload", warnBridgeActiveOnBeforeUnload);
    //         ourPort.removeEventListener("message", processBridgeMessage);
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

    //                 let xhr: JQueryXHR;

    //                 switch (data.method) {
    //                     case "GET": {
    //                         xhr = this.ajaxFuncs!.get(data.url).xhr;
    //                         break;
    //                     }

    //                     case "POST": {
    //                         xhr = this.ajaxFuncs!.post(data.url, data.data).xhr;
    //                         break;
    //                     }

    //                     default: {
    //                         return this.dispatchError(new Error(`Unrecognised method ${data.method}`));
    //                     }
    //                 }

    //                 xhr
    //                     .done((data, textStatus) => {
    //                         const packet: BridgeXhrSuccess = {
    //                             event: "mc_bridge_xhrSuccess",
    //                             data: {
    //                                 xhrId,
    //                                 textStatus,
    //                                 data,
    //                             },
    //                         }

    //                         ourPort.postMessage(packet);
    //                     })
    //                     .fail((_jqXhr, textStatus, errorThrown) => {
    //                         const packet: BridgeXhrFail = {
    //                             event: "mc_bridge_xhrFail",
    //                             data: {
    //                                 xhrId,
    //                                 textStatus,
    //                                 errorThrown,
    //                             },
    //                         }

    //                         ourPort.postMessage(packet);
    //                     });

    //                 return;
    //             }
    //         }

    //         console.log(e);
    //     }

    //     // Listen over the bridge via. the set port
    //     ourPort.addEventListener("message", processBridgeMessage);

    //     // Ports must be 'started' when using #addEventListener()
    //     ourPort.start();

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