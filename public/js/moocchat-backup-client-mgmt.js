/// <reference path="./settings.js" />
/// <reference path="./stateflow.js" />

$(function() {
    var socket = connect();
    var username;

    var STATE = {
        LOGIN: 1,
        QUESTION_RESPONSE: 2,
        MANAGEMENT: 3,
        CHAT: 4
    };

    /**
     * Quick mapping for passing selectors into "page" context
     * or getting the page root element
     */
    var _$ = function(selector) {
        if (selector) {
            return $(selector, StateFlow.getRootElem());
        }

        return StateFlow.getRootElem();
    }

    /** Maps to StateFlow.goTo */
    var _go = StateFlow.goTo;

    /** Useful for plain socket communication that requires username as only input */
    var _usernameObj = function() {
        return {
            username: username
        }
    }

    function login_onEnter() {
        _$("form").on("submit", function(e) {
            e.preventDefault();

            // Sign in
            username = $("#username").val();

            socket.emit("backupClientLogin", _usernameObj());

            socket.once("backupClientLoginState", function(data) {
                if (data.success) {
                    // Once signed in, proceed to question-response
                    _go(STATE.QUESTION_RESPONSE);
                } else {
                    alert(data.message);
                }
            });
        });
    }

    function questionResponse_onEnter() {
        // Fetch question content and force response to question before joining queue
        _$("form").on("submit", function(e) {
            e.preventDefault();

            var answer = 0; // TODO: index of answer
            var justification = _$("#justification").val();

            // Store answers with client
            socket.emit("backupClientEnterQueue", {
                username: username,
                answer: answer,
                justification: justification
            });

            socket.once("backupClientEnterQueueState", function(data) {
                if (data.success) {
                    // When okay, proceed to management page
                    _go(STATE.MANAGEMENT);
                }
            });
        });
    }

    function management_onEnter(data) {
        var $backupClientQueue = _$("ul#backup-client-queue");
        var $numOfClientsInPool = _$("span#number-of-clients-in-pool");

        /**
         * data = {
         *      clients {Client[]}
         * }
         */
        function onBackupClientQueueUpdate(data) {
            $backupClientQueue.empty();

            data.clients.forEach(function(client) {
                var $backupClientLI = $("<li>").text(client.username);

                if (client.username === username) {
                    $("<button>")
                        .addClass("btn btn-xs btn-danger")
                        .prop("id", "logout")
                        .text("Logout")
                        .on("click", function() {
                            // TODO: Fire logout
                        })
                        .appendTo($backupClientLI);
                }

                $backupClientLI.appendTo($backupClientQueue);
            });
        }

        /**
         * data = {
         *      numberOfClients {number}
         * }
         */
        function onClientPoolCountUpdate(data) {
            $numOfClientsInPool.text(data.numberOfClients);
        }


        function onBackupClientTransferCall(data) {
            var $transferConfirmBox = _$("#transfer-confirmation");
            var $transferCountdown = _$("#transfer-remaining-seconds");

            $transferConfirmBox.removeClass("hidden");

            var value = 15;
            
            function countdown() {
                $transferCountdown.text(value--);
            }

            var countdownIntervalHandle = setInterval(countdown, 1000);
            countdown();

            $transferConfirmBox.one("click", "#confirm-transfer", function() {
                $transferConfirmBox.addClass("hidden");
                clearInterval(countdownIntervalHandle);
                socket.emit("backupClientTransferConfirm", _usernameObj());

                socket.once("chatGroupFormed", function(data) {
                    _go(STATE.CHAT, data);
                });
            });
        }


        // Attach socket listeners to queue and pool status
        socket.on("backupClientQueueUpdate", onBackupClientQueueUpdate);
        socket.on("clientPoolCountUpdate", onClientPoolCountUpdate);
        socket.on("backupClientTransferCall", onBackupClientTransferCall);
        // TODO: socket.on("backupClientEjected", onbackupClientEjected);

        // Request information now (once only)
        socket.emit("backupClientStatusRequest", _usernameObj());
    }

    function management_onLeave() {
        // Detach socket listeners to queue and pool status
        socket.off("backupClientQueueUpdate");
        socket.off("clientPoolCountUpdate");
        socket.off("backupClientTransferCall");
    }


    function chat_onEnter(data) {
        var $chatBox = _$("#chat-box");
        var $requestQuitButton = _$("#request-end-chat");
        var $chatInputForm = _$("form");

        var myScreenName = data.screenName;
        var chatGroupId = data.groupId;
        var chatGroupSize = data.groupSize;
        var chatGroupAnswers = data.groupAnswers;

        function addMessageToChatBox(screenName, message) {
            $("<blockquote>")
                .attr("data-screenname", screenName)
                .text(message)
                .appendTo($chatBox);
        }

        addMessageToChatBox("SYSTEM", "Chat group size = " + chatGroupSize);
        addMessageToChatBox("SYSTEM", "You are " + myScreenName);

        chatGroupAnswers.forEach(function(answerObj) {
            addMessageToChatBox(answerObj.screenName, "Answer: " + answerObj.answer + "; Justification: " + answerObj.justification);
        });



        socket.on("chatGroupMessage", function(data) {
            addMessageToChatBox(data.screenName, data.message);

            // TODO: Don't scroll chat box if box is not scrolled
            // to bottom (user might be reviewing something)
            $chatBox.scrollTop($chatBox.get(0).scrollHeight);
        });

        socket.on("chatGroupQuitChange", function(data) {
            // If everyone quits, move on now
            if (data.quitQueueSize >= data.groupSize) {
                alert("Session ended");
            }
        });

        $chatInputForm.on("submit", function(e) {
            e.preventDefault();

            var message = _$("#chat-input").val();
            if (message.length == 0) return;

            socket.emit("chatGroupMessage", {
                groupId: chatGroupId,
                username: username,
                message: message
            });

            _$("#chat-input").val("").focus();
        });
    }

    function chat_onLeave() {
        socket.off("chatGroupMessage");
        socket.off("chatGroupQuitChange");
        _$("form").off("submit");
    }


    StateFlow.registerAll([
        {
            state: STATE.LOGIN,
            page: "#login",
            onEnter: login_onEnter
        },
        {
            state: STATE.QUESTION_RESPONSE,
            page: "#question-response",
            onEnter: questionResponse_onEnter
        },
        {
            state: STATE.MANAGEMENT,
            page: "#management",
            onEnter: management_onEnter,
            onLeave: management_onLeave
        },
        {
            state: STATE.CHAT,
            page: "#chat",
            onEnter: chat_onEnter,
            onLeave: chat_onLeave
        }
    ]);

    StateFlow.goTo(STATE.LOGIN);





    // Set up the page by requesting login

    // Once logged in - show question and ask for answer/justification.

    // Once answered - then show status, queue and question information (backup client should now be in the queue)




    // When called for, request confirmation from backup client (~15 seconds)

    // They must accept and then be placed into a chat session

    // Once chat session ends, the backup client is returned back to the queue












});