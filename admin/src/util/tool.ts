
const indexHtml = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <title>mousoku-elipss</title>
</head>

<body>
    <div id="mousoku-app" class="pos-abs-fill"></div>
    <script>__REACT_DEVTOOLS_GLOBAL_HOOK__ = parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;</script>
    <script>
    </script>
</body>

</html>


`;

export const html = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <title>mousoku-elipss over MOOCchat Bridge</title>

    <style>
        html,
        body,
        iframe {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: 0;
        }
        
        iframe {
            position: absolute;
        }
    </style>

    <script>
        // getBridge is a global fetched from child frames
        var getBridge = function() { throw new Error("No bridge available"); };

        (function() {
            var bridgePort;
            var xhrId = 0;
            var xhrCallbacks = {};
            
            getBridge = function() {
                return {
                    sendXhrRequest: sendXhrRequest,
                    isXhrInProgress: isXhrInProgress
                };
            }
            
            function isXhrInProgress() {
                return Object.keys(xhrCallbacks).length > 0;
            }

            function onBridgeReady() {
                document.getElementById("iframe").srcdoc = "${indexHtml}";
            }

            function sendXhrRequest(method, url, data, onSuccess, onFail) {
                // Increment XHR ID
                ++xhrId;

                // Store callbacks
                xhrCallbacks[xhrId] = {
                    onSuccess: onSuccess,
                    onFail: onFail
                };

                // Send request over bridge
                bridgePort.postMessage({
                        event: "mc_bridge_xhrRequest",
                        data: {
                            xhrId: xhrId,
                            method: method,
                            url: url,
                            data: data
                        }
                    });

                // XHR response is handled via. bridge messages
            }

            function handleBridgeMessage(e) {
                var packet = e.data;
                console.log(packet.data);

                switch (packet.event) {
                    case "mc_bridge_xhrSuccess":
                        var xhrId = packet.data.xhrId;
                        var onSuccess = xhrCallbacks[xhrId].onSuccess;
                        
                        delete xhrCallbacks[xhrId];

                        onSuccess && onSuccess(packet.data.data, packet.data.textStatus);

                        return;
                    
                    case "mc_bridge_xhrFail":
                        var xhrId = packet.data.xhrId;
                        var onFail = xhrCallbacks[xhrId].onFail;
                        
                        delete xhrCallbacks[xhrId];

                        onFail && onFail(packet.data.textStatus, packet.data.errorThrown);

                        return;
                }

                console.log(e);
            }

            function setupBridgePort(e) {
                // Set up marking bridge port
                if (e.data === "mc_bridge_port" && !bridgePort && e.ports[0]) {
                    bridgePort = e.ports[0];

                    // Send ready reply (this will be queued until port is started)
                    bridgePort.postMessage({
                        event: "mc_bridge_ready",
                        data: {
                            application: {
                                name: "mousoku-elipss",
                            },
                        },
                    });

                    // Set up port listener
                    bridgePort.addEventListener("message", handleBridgeMessage);

                    // Ports must be 'started' when using #addEventListener()
                    // Queued messages are sent at this point
                    bridgePort.start();

                    // This is no longer needed once port set up
                    window.removeEventListener("message", setupBridgePort);


                    onBridgeReady();
                }
            }

            function onBeforeUnload(e) {
                if (isXhrInProgress()) {
                    var message = "You are about to leave the marking tool before it has completed background operations. Exiting now may result in incomplete operations.";

                    e.returnValue = message;
                    return message;
                }

                // Post bridge close event
                bridgePort.postMessage({
                    event: "mc_bridge_close",
                    data: null
                });
            }

            window.addEventListener("message", setupBridgePort);
            window.addEventListener("beforeunload", onBeforeUnload);

            // Workaround: IE/Edge doesn't fire load event?
            // Request port via. window.name - will be picked up by opener
            window.name = "mc_bridge_port_request";
        })();
        </script>
</head>

<body>
    <iframe id="iframe"></iframe>
</body>

</html>


`;

