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

    function login_onEnter() {
        _$("form").on("submit", function(e) {
            e.preventDefault();

            // Sign in
            username = $("#username").val();

            socket.emit("backupClientLogin", {
                username: username
            });

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
                $("<li>").text(client.username).appendTo($backupClientQueue);
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

        // Attach socket listeners to queue and pool status
        socket.on("backupClientQueueUpdate", onBackupClientQueueUpdate);
        socket.on("clientPoolCountUpdate", onClientPoolCountUpdate);

        // Request information now (once only)
        socket.emit("backupClientStatusRequest", {
            username: username
        });
    }

    function management_onLeave() {
        // Detach socket listeners to queue and pool status
        socket.off("backupClientQueueUpdate");
        socket.off("clientPoolCountUpdate");
    }


    function chat_onEnter() {
        var $chatBox = _$("#chat-box");

        function addMessageToChatBox(screenName, message) {
            $("<blockquote>")
                .attr("data-screenname", screenName)
                .text(message)
                .appendTo($chatBox);
        }

        socket.on("chatGroupMessage", function() {
            addMessageToChatBox(0, 0);
            $chatBox.scrollTop($chatBox.scrollHeight);
        });

        socket.on("chatGroupQuitChange", function() {

        });
    }

    function chat_onLeave() {
        socket.off("chatGroupMessage");
        socket.off("chatGroupQuitChange");
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