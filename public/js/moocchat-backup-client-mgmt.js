/// <reference path="./settings.js" />
/// <reference path="./moocchat.stages.js" />
/// <reference path="./stateflow.js" />

$(function() {
    var socket = connect();

    var username;
    var sessionId;

    var chatTimerHandle;
    var countdownIntervalHandle;

    var quiz;
    var selectedAnswerIndex;
    var selectedAnswerJustification;

    var chatTimeSeconds = getStageSeconds(DISCUSS_PROBING_STAGE);  // Fetched from ./moocchat.stages.js

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

    /** Useful for plain socket communication that requires session ID as only input */
    var _sessionIdObj = function() {
        return {
            sessionId: sessionId
        }
    }


    function joinBackupClientQueueProceedToMgmtState() {
        // Store answers with client
        socket.emit("backupClientEnterQueue", {
            sessionId: sessionId,
            answer: selectedAnswerIndex,
            justification: selectedAnswerJustification
        });

        socket.once("backupClientEnterQueueState", function(data) {
            if (data.success) {
                // When okay, proceed to management page
                _go(STATE.MANAGEMENT);
            }
        });
    }



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
                    sessionId = data.sessionId;
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

            var answer = _$("input[name='moocchat-question']:checked").val();
            var justification = _$("#justification").val();

            if (!answer || $.trim(justification).length === 0) {
                alert("Answer and/or justification required");
                return;
            }

            // Convert answer string value into number
            selectedAnswerIndex = +new Number(answer);

            selectedAnswerJustification = justification;

            joinBackupClientQueueProceedToMgmtState();
        });


        socket.emit("questionContentRequest", _sessionIdObj());

        socket.once("questionContent", function(data) {
            quiz = data.quiz;

            _$("#question-reading").html(quiz.reading);
            _$("#question-statement").html(quiz.probingQuestion);
            quiz.probingQuestionChoices.forEach(function(answerChoice, i) {
                $("<li>")
                    .text(answerChoice)
                    .prepend($("<input type='radio'>")
                        .prop({
                            name: "moocchat-question",
                            value: i
                        }))
                    .appendTo(_$("#answers"));
            });
        });
    }

    function management_onEnter() {
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
                            window.location.reload(true);
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

        function onBackupClientTransferCall() {
            var $transferConfirmBox = _$("#transfer-confirmation");
            var $transferCountdown = _$("#transfer-remaining-seconds");

            $transferConfirmBox.removeClass("hidden");

            var value = 15;

            function countdown() {
                $transferCountdown.text(value--);
            }

            countdownIntervalHandle = setInterval(countdown, 1000);
            countdown();

            $transferConfirmBox.one("click", "#confirm-transfer", function() {
                $transferConfirmBox.addClass("hidden");
                clearInterval(countdownIntervalHandle);
                socket.emit("backupClientTransferConfirm", _sessionIdObj());

                socket.once("chatGroupFormed", function(data) {
                    _go(STATE.CHAT, data);
                });
            });

            // https://notificationsounds.com/message-tones/mission-accomplished-252
            var notificationTone = new Audio("./mp3/mission-accomplished.mp3");
            notificationTone.play();
        }

        function onbackupClientEjected() {
            var $transferConfirmBox = _$("#transfer-confirmation");
            var $ejectedBox = _$("#ejected-dialog");

            clearInterval(countdownIntervalHandle);

            $transferConfirmBox.addClass("hidden");
            $ejectedBox.removeClass("hidden");

            $("#re-login", $ejectedBox).one("click", function() {
                window.location.reload(true);
            });
        }

        // Attach socket listeners to queue and pool status
        socket.on("backupClientQueueUpdate", onBackupClientQueueUpdate);
        socket.on("clientPoolCountUpdate", onClientPoolCountUpdate);
        socket.on("backupClientTransferCall", onBackupClientTransferCall);
        socket.on("backupClientEjected", onbackupClientEjected);

        // Request information now (once only)
        socket.emit("backupClientStatusRequest", _sessionIdObj());
    }

    function management_onLeave() {
        // Detach socket listeners to queue and pool status
        socket.off("backupClientQueueUpdate");
        socket.off("clientPoolCountUpdate");
        socket.off("backupClientTransferCall");
        socket.off("backupClientEjected");
    }

    function chat_onEnter(data) {
        var $chatBox = _$("#chat-box");
        var $requestQuitButton = _$("#request-end-chat");
        var $chatInputForm = _$("form");
        var $chatTimer = _$("#chat-timer");

        var myScreenName = data.screenName;
        var chatGroupId = data.groupId;
        var chatGroupSize = data.groupSize;
        var chatGroupAnswers = data.groupAnswers;

        var wantToQuit = false;

        var chatStartTime = new Date().valueOf();

        function addMessageToChatBox(screenName, message) {
            $("<blockquote>")
                .addClass((screenName === myScreenName) ? "me" : "")
                .attr("data-screenname", screenName)
                .text(message)
                .appendTo($chatBox);
        }

        $chatBox.empty();
        addMessageToChatBox("system", "Chat group size = " + chatGroupSize);
        addMessageToChatBox("system", "You are " + myScreenName);

        chatGroupAnswers.forEach(function(answerObj) {
            addMessageToChatBox(answerObj.screenName, "Answer: " + String.fromCharCode(65 + answerObj.answer) + "; Justification: " + answerObj.justification);
        });

        _$("#question-reading").html(quiz.reading);
        _$("#question-statement").html(quiz.probingQuestion);
        _$("#answers").empty();
        quiz.probingQuestionChoices.forEach(function(answerChoice, i) {
            $("<li>")
                .addClass((i === selectedAnswerIndex) ? "selected" : "")
                .text(answerChoice)
                .appendTo(_$("#answers"));
        });

        chatTimerHandle = setInterval(function() {
            var now = new Date().valueOf();

            var timeLeftMs = (chatTimeSeconds * 1000) - (now - chatStartTime);

            // End chat by clicking end chat button
            if (timeLeftMs < 0) {
                $requestQuitButton.trigger("click");
                return;
            }

            // Cheating by using Date to get minutes and seconds for us
            var timeLeft = new Date(timeLeftMs);
            var sec = timeLeft.getUTCSeconds();

            $chatTimer.text(timeLeft.getUTCMinutes() + ":" + ((sec < 10) ? "0" + sec : sec));

        }, 500);

        socket.on("chatGroupMessage", function(data) {
            addMessageToChatBox(data.screenName, data.message);

            // TODO: Don't scroll chat box if box is not scrolled
            // to bottom (user might be reviewing something)
            $chatBox.scrollTop($chatBox.get(0).scrollHeight);
        });

        socket.on("chatGroupQuitChange", function(data) {
            // If everyone quits, move on now
            if (data.quitQueueSize >= data.groupSize) {
                joinBackupClientQueueProceedToMgmtState();
            }

            addMessageToChatBox("system", data.quitQueueSize + " of " + data.groupSize + " members requesting to end chat");
        });

        $chatInputForm.on("submit", function(e) {
            e.preventDefault();

            var message = _$("#chat-input").val();
            if (message.length == 0) return;

            socket.emit("chatGroupMessage", {
                groupId: chatGroupId,
                sessionId: sessionId,
                message: message
            });

            _$("#chat-input").val("").focus();
        });

        $requestQuitButton.text(wantToQuit ? "Cancel End Chat Request" : "Request End Chat");

        $requestQuitButton.on("click", function() {
            socket.emit("chatGroupQuitStatusChange", {
                groupId: chatGroupId,
                sessionId: sessionId,
                quitStatus: (wantToQuit = !wantToQuit)
            });

            $requestQuitButton.text(wantToQuit ? "Cancel End Chat Request" : "Request End Chat");
        });
    }

    function chat_onLeave() {
        socket.off("chatGroupMessage");
        socket.off("chatGroupQuitChange");
        _$("form").off("submit");
        _$("#request-end-chat").off("click");

        clearInterval(chatTimerHandle);
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