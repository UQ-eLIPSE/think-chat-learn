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
            new Layout("admin-marking", this.getLayoutData())
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
        const markingWindow = window.open(url, undefined, "menubar=0,toolbar=0,location=0,personalbar=0,directories=0,status=0,resizable=1,scrollbars=0");

        const sendPort = () => {
            markingWindow.postMessage("mc_bridge_port", "*", [theirPort]);
        }

        const processBridgeMessage = (e: MessageEvent) => {
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

            const packet: BridgePacket = e.data;

            switch (packet.event) {
                case "mc_bridge_ready": {
                    // We're ready to go
                    // TODO: Make it hard to close this window at this point,
                    //       because this component is required to be active when marking

                    return;
                }

                case "mc_bridge_close": {
                    // TODO: Close the bridge, clean up, enable window to move on
                    ourPort.close();
                    ourPort.removeEventListener("message", processBridgeMessage);
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

        // Once marking tool loaded, send MessagePort so it knows how to communicate back
        markingWindow.addEventListener("load", sendPort);
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