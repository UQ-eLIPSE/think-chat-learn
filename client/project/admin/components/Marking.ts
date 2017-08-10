import * as $ from "jquery";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

export class Marking extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();
        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;

        });

        this.setRenderFunc(() => {
            return new Layout("admin-marking", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setSectionActive)
                .then(this.setupListElemClick)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private readonly setSectionActive = () => {
        this.dispatch("setSectionActive", "marking", true);
    }

    private readonly setupListElemClick = () => {
        const $list = this.section$("#marking-tools");

        $list.on("click", "a", (e) => {
            const $linkElem = $(e.currentTarget);

            // Fetch href which should be tied to element
            const data = $linkElem.data("href");
            this.processAction("launch-tool", data);
        });
    }

    private readonly launchMarkingTool = (url: string) => {
        const bridgeChannel = new MessageChannel();
        const ourPort = bridgeChannel.port1;
        const theirPort = bridgeChannel.port2;
        const markingWindow = window.open("", undefined, "menubar=0,toolbar=0,location=0,personalbar=0,directories=0,status=0,resizable=1,scrollbars=0");

        // Prevent leaking opener
        markingWindow.opener = null;

        let applicationName: string | undefined;
        let $warning: JQuery | undefined;

        const sendPort = () => {
            markingWindow.postMessage("mc_bridge_port", "*", [theirPort]);
            // markingWindow.removeEventListener("load", sendPort);
        }

        const warnBridgeActiveOnBeforeUnload = (e: BeforeUnloadEvent) => {
            var message = `Application "${applicationName}" is currently using MOOCchat Bridge. If you exit now, "${applicationName}" will be unable to continue functioning.`;

            e.returnValue = message;
            return message;
        }

        const closeBridge = () => {
            // Close the bridge, clean up, enable window to move on
            window.removeEventListener("beforeunload", warnBridgeActiveOnBeforeUnload);
            ourPort.removeEventListener("message", processBridgeMessage);
            ourPort.close();

            if ($warning) {
                $warning.remove();
            }
        }

        const processBridgeMessage = (e: MessageEvent) => {
            const packet: BridgePacket = e.data;

            switch (packet.event) {
                case "mc_bridge_ready": {
                    const _packet: BridgeReady = packet;
                    const data = _packet.data;

                    // Set application name
                    applicationName = data.application.name;

                    // Display warning over page
                    $warning = $("<div>")
                        .addClass("mc-full-screen-msg-container")
                        .append([
                            $("<div>")
                                .append([
                                    $("<h1>").text(`"${applicationName}" is currently using MOOCchat Bridge`),
                                    $("<p>").text(`If you exit now, "${applicationName}" will be unable to continue functioning.`),
                                    $("<p>").text(`To close MOOCchat Bridge, return to "${applicationName}" and exit the application normally.`),
                                    $("<button>").text("Force close MOOCchat Bridge").one("click", closeBridge),
                                ])
                        ]);

                    $("body").append($warning);

                    // Warn when leaving
                    window.addEventListener("beforeunload", warnBridgeActiveOnBeforeUnload);

                    return;
                }

                case "mc_bridge_close": {
                    closeBridge();
                    return;
                }

                case "mc_bridge_xhrRequest": {
                    const _packet: BridgeXhrRequest = packet;
                    const data = _packet.data;

                    const xhrId = data.xhrId;

                    let xhr: JQueryXHR;

                    switch (data.method) {
                        case "GET": {
                            xhr = this.ajaxFuncs!.get(data.url).xhr;
                            break;
                        }

                        case "POST": {
                            xhr = this.ajaxFuncs!.post(data.url, data.data).xhr;
                            break;
                        }

                        default: {
                            return this.dispatchError(new Error(`Unrecognised method ${data.method}`));
                        }
                    }

                    xhr
                        .done((data, textStatus) => {
                            const packet: BridgeXhrSuccess = {
                                event: "mc_bridge_xhrSuccess",
                                data: {
                                    xhrId,
                                    textStatus,
                                    data,
                                },
                            }

                            ourPort.postMessage(packet);
                        })
                        .fail((_jqXhr, textStatus, errorThrown) => {
                            const packet: BridgeXhrFail = {
                                event: "mc_bridge_xhrFail",
                                data: {
                                    xhrId,
                                    textStatus,
                                    errorThrown,
                                },
                            }

                            ourPort.postMessage(packet);
                        });

                    return;
                }
            }

            console.log(e);
        }

        // Listen over the bridge via. the set port
        ourPort.addEventListener("message", processBridgeMessage);

        // Ports must be 'started' when using #addEventListener()
        ourPort.start();

        // Go to page
        markingWindow.location.assign(url);

        // Workaround: IE/Edge doesn't fire load event?
        // Check window.name for port request
        let windowNameCheckMaxTries = 500;  // 25s
        const windowNameCheckHandle: number = setInterval(() => {
            if (markingWindow.name === "mc_bridge_port_request") {
                sendPort();
                return clearInterval(windowNameCheckHandle);
            }

            if (--windowNameCheckMaxTries === 0) {
                alert(`Bridge application at "${url}" failed to connect to MOOCchat`);
                clearInterval(windowNameCheckHandle);
            }
        }, 50);
    }

    private readonly processAction = (action: string, data?: any) => {
        switch (action) {
            case "launch-tool": {   // @param data {string} url
                const url: string = data;
                this.launchMarkingTool(url);
                return true;
            }

            // default: {
            //     const className: string = (<any>this.constructor).name || "[class]";
            //     this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
            // }
        }

        return false;
    }
}


interface BridgePacket {
    event: string,
    data: any,
}

interface BridgeXhrRequest extends BridgePacket {
    data: {
        xhrId: string,  // The XHR requestor must identify their XHR request with a self-generated ID so that once the data is returned, the requestor is able to sort out what request is what
        method: "GET" | "POST",
        url: string,
        data?: any,
    }
}

interface BridgeXhrSuccess extends BridgePacket {
    event: "mc_bridge_xhrSuccess",
    data: {
        xhrId: string,
        textStatus: string,
        data: any,
    }
}

interface BridgeXhrFail extends BridgePacket {
    event: "mc_bridge_xhrFail",
    data: {
        xhrId: string,
        textStatus: string,
        errorThrown: any,
    }
}

interface BridgeReady extends BridgePacket {
    data: {
        application: {
            name: string,
        }
    }
}