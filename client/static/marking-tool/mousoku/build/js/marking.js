define(["require", "exports", "jquery", "diff", "./classes/MoocchatBridge"], function (require, exports, $, JsDiff, MoocchatBridge_1) {
    "use strict";
    var bridge = MoocchatBridge_1.MoocchatBridge.GetBridge();
    (function () {
        var quizScheduleString = sessionStorage.getItem("quizSchedule");
        if (!quizScheduleString) {
            return alert("Quiz schedule missing");
        }
        var quizSchedule = JSON.parse(quizScheduleString);
        var questionString = sessionStorage.getItem("question");
        if (!questionString) {
            return alert("Question missing");
        }
        var question = JSON.parse(questionString);
        var $quizScheduleName = $("#quiz-schedule-name");
        $quizScheduleName.text(question.title + " (" + quizSchedule.availableStart + " to " + quizSchedule.availableEnd + ")");
        var quizAttemptId;
        if (window.location.hash) {
            quizAttemptId = window.location.hash.substring(1);
        }
        var fetchData = function (callback) {
            var quizId = quizSchedule._id;
            bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/questionResponse", undefined, function (response) {
                var questionResponses = response.payload;
                bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/chatGroup", undefined, function (response) {
                    var chatGroups = response.payload;
                    bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/chatMessage", undefined, function (response) {
                        var chatMessages = response.payload;
                        bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/quizAttempt_user", undefined, function (response) {
                            var _quizAttempt_users = response.payload;
                            var quizAttempt_users = [];
                            var quizAttemptLookup = {};
                            var chatGroupLookup = {};
                            var chatGroup_chatMessages = {};
                            var quizAttempt_chatGroup = {};
                            var questionResponseLookup = {};
                            _quizAttempt_users.forEach(function (quizAttempt_user) { return quizAttemptLookup[quizAttempt_user._id] = quizAttempt_user; });
                            chatGroups.forEach(function (chatGroup) {
                                chatGroupLookup[chatGroup._id] = chatGroup;
                                quizAttempt_users.push.apply(quizAttempt_users, (chatGroup.quizAttemptIds.map(function (quizAttemptId) { return quizAttemptLookup[quizAttemptId]; })));
                                chatGroup.quizAttemptIds.forEach(function (quizAttemptId) {
                                    quizAttempt_chatGroup[quizAttemptId] = chatGroup;
                                });
                            });
                            _quizAttempt_users.forEach(function (quizAttempt) { return !quizAttempt_chatGroup[quizAttempt._id] && quizAttempt_users.push(quizAttemptLookup[quizAttempt._id]); });
                            chatMessages.forEach(function (chatMessage) {
                                var chatMessageArray = chatGroup_chatMessages[chatMessage.chatGroupId];
                                if (!chatMessageArray) {
                                    chatMessageArray = chatGroup_chatMessages[chatMessage.chatGroupId] = [];
                                }
                                chatMessageArray.push(chatMessage);
                            });
                            questionResponses.forEach(function (questionResponse) { return questionResponseLookup[questionResponse._id] = questionResponse; });
                            Object.keys(chatGroup_chatMessages).forEach(function (chatGroupId) {
                                chatGroup_chatMessages[chatGroupId].sort(function (a, b) {
                                    if (a.timestamp > b.timestamp) {
                                        return 1;
                                    }
                                    if (a.timestamp < b.timestamp) {
                                        return -1;
                                    }
                                    return 0;
                                });
                            });
                            callback({
                                quizAttempt_users: quizAttempt_users,
                                questionResponseLookup: questionResponseLookup,
                                chatGroup_chatMessages: chatGroup_chatMessages,
                                quizAttempt_chatGroup: quizAttempt_chatGroup
                            });
                        });
                    });
                });
            });
        };
        var onUserSessionsLoaded = function (data) {
            $(function () {
                var $markingLayout = $("#marking-layout");
                var $markingBar = $("#marking-bar");
                var $markingJustificationInitial = $("#marking-justification-initial");
                var $markingJustificationFinal = $("#marking-justification-final");
                var $markingChats = $("#marking-chats");
                var $markingChatsOverviewBar = $("#marking-chats-overview-bar");
                var $markValue = $("#mark-value");
                var $numberOfSessions = $("#number-of-sessions");
                var $activeSessionNumber = $("#active-session-number");
                var $activeSessionUserId = $("#active-session-user-id");
                var $activeSessionUserName = $("#active-session-user-name");
                var $activeSessionId = $("#active-session-id");
                var $activeSessionChatGroupId = $("#active-session-chat-group-id");
                var $buttonToggleDiffRemovedVisible = $("#toggle-diff-removed-visible");
                var $buttonToggleDiffAddedVisible = $("#toggle-diff-added-visible");
                var $buttonToggleNoBg = $("#toggle-no-bg");
                var $buttonGoToPage = $("#go-to-page");
                var $buttonLookupSession = $("#lookup-session");
                var $buttonLookupUser = $("#lookup-user");
                var $messagePressInsertToEdit = $("#message-press-insert-to-edit");
                var $exitButton = $("#exit");
                var toggleLeftHandMode = function () {
                    $markingLayout.toggleClass("left-handed");
                };
                var toggleDiffRemovedVisibleMode = function () {
                    $markingLayout.toggleClass("hide-justification-diff-removed");
                    updateDiffRemovedVisibleModeState();
                };
                var toggleDiffAddedVisibleMode = function () {
                    $markingLayout.toggleClass("hide-justification-diff-added");
                    updateDiffAddedVisibleModeState();
                };
                var toggleTraditionalScrollChatsMode = function () {
                    $markingLayout.toggleClass("traditional-scroll-chats");
                    updateMarkingChatsDimensionsCache();
                };
                var updateDiffRemovedVisibleModeState = function () {
                    $(".state", $buttonToggleDiffRemovedVisible).text("" + !$markingLayout.hasClass("hide-justification-diff-removed"));
                };
                var updateDiffAddedVisibleModeState = function () {
                    $(".state", $buttonToggleDiffAddedVisible).text("" + !$markingLayout.hasClass("hide-justification-diff-added"));
                };
                var showMessagePressInsertToEdit = function () {
                    $messagePressInsertToEdit.finish().show().fadeOut(4000);
                };
                var toggleNoBg = function () {
                    $markingChats.toggleClass("no-bg");
                    updateMarkingChatsDimensionsCache();
                };
                updateDiffRemovedVisibleModeState();
                updateDiffAddedVisibleModeState();
                $messagePressInsertToEdit.hide();
                var clearChats = function () {
                    $markingChatsOverviewBar.empty();
                    $markingChats.empty();
                    updateMarkingChatsDimensionsCache();
                };
                var clearJustifications = function () {
                    $markingJustificationInitial.empty();
                    $markingJustificationFinal.empty();
                };
                var insertChats = function (chatGroup, chatMessages, activeQuizAttempt) {
                    var chatBlockquotes = [];
                    var chatOverviews = [];
                    chatMessages.forEach(function (chatMessage) {
                        var chatClass = (chatMessage.quizAttemptId === activeQuizAttempt._id) ? "active" : undefined;
                        var memberNumber = chatGroup.quizAttemptIds.indexOf(chatMessage.quizAttemptId) + 1;
                        chatBlockquotes.push($("<blockquote>")
                            .data("sessionId", chatMessage.quizAttemptId)
                            .attr("data-member-number", memberNumber)
                            .addClass(chatClass)
                            .text(chatMessage.content));
                        chatOverviews.push($("<div>")
                            .attr("data-member-number", memberNumber)
                            .addClass(chatClass)
                            .appendTo($markingChatsOverviewBar));
                    });
                    $markingChats.append(chatBlockquotes);
                    $markingChatsOverviewBar.append(chatOverviews);
                };
                var insertJustifications = function (initial, final) {
                    var initialJustification = (initial && initial.justification) || "";
                    var finalJustification = (final && final.justification) || "";
                    var diff = JsDiff.diffWords(initialJustification, finalJustification);
                    var justificationInitialComponents = [];
                    var justificationFinalComponents = [];
                    diff.forEach(function (part) {
                        var partClass;
                        if (part.added) {
                            partClass = "added";
                            justificationFinalComponents.push($("<span>").text(part.value).addClass(partClass));
                            return;
                        }
                        else if (part.removed) {
                            partClass = "removed";
                            justificationInitialComponents.push($("<span>").addClass("removed").append($("<span>").text(part.value)));
                            return;
                        }
                        justificationInitialComponents.push($("<span>").text(part.value));
                        justificationFinalComponents.push($("<span>").text(part.value));
                    });
                    $markingJustificationInitial.append((initial && initial.justification) ? justificationInitialComponents : "********** Data missing **********");
                    $markingJustificationFinal.append((final && final.justification) ? justificationFinalComponents : "********** Data missing **********");
                };
                var $markingChatsOverviewBar_OffsetTop;
                var $markingChatsOverviewBar_Height;
                var $markingChats_ScrollHeight;
                var updateMarkingChatsDimensionsCache = function () {
                    $markingChatsOverviewBar_OffsetTop = $markingChatsOverviewBar.offset().top;
                    $markingChatsOverviewBar_Height = $markingChatsOverviewBar.outerHeight();
                    updateMarkingChatScrollHeight();
                };
                var updateMarkingChatScrollHeight = function () {
                    $markingChats_ScrollHeight = $markingChats[0].scrollHeight;
                };
                updateMarkingChatsDimensionsCache();
                var activeQuizAttempt;
                var loadSession = function (_index) {
                    if (_index < 0) {
                        _index = 0;
                    }
                    if (_index > data.quizAttempt_users.length - 1) {
                        _index = data.quizAttempt_users.length - 1;
                    }
                    index = _index;
                    activeQuizAttempt = data.quizAttempt_users[index];
                    if (!activeQuizAttempt) {
                        return;
                    }
                    $activeSessionNumber.text(index + 1);
                    var quizAttemptId = activeQuizAttempt._id;
                    var chatGroup = data.quizAttempt_chatGroup[quizAttemptId];
                    var responseInitial = data.questionResponseLookup[activeQuizAttempt.responseInitialId];
                    var responseFinal = data.questionResponseLookup[activeQuizAttempt.responseFinalId];
                    clearChats();
                    clearJustifications();
                    if (chatGroup) {
                        var chatMessages = data.chatGroup_chatMessages[chatGroup._id];
                        if (chatMessages) {
                            insertChats(chatGroup, chatMessages, activeQuizAttempt);
                        }
                    }
                    insertJustifications(responseInitial, responseFinal);
                    $activeSessionUserId.text(activeQuizAttempt._user.username);
                    $activeSessionUserName.text(activeQuizAttempt._user.firstName + " " + activeQuizAttempt._user.lastName);
                    $activeSessionId.text(activeQuizAttempt._id);
                    $activeSessionChatGroupId.text((chatGroup && chatGroup._id) || "*** Did not enter chat ***");
                    updateMarkingChatScrollHeight();
                    $("body").removeClass("loading");
                    $markValue.empty().removeClass().text("...");
                    bridge.sendXhrRequest("GET", "/api/admin/quizAttempt/" + activeQuizAttempt._id + "/mark", undefined, function (response) {
                        var mark = response.payload;
                        if (!mark) {
                            $markValue.text("2");
                            return;
                        }
                        if (activeQuizAttempt._id !== mark.quizAttemptId) {
                            return;
                        }
                        $markValue.empty().removeClass().addClass("saved").text(mark.value);
                    });
                    $messagePressInsertToEdit.hide();
                };
                var saveMark = function (callback) {
                    if (!$markValue.hasClass("edit-mode")) {
                        callback();
                        return;
                    }
                    var markValue = parseInt($markValue.text(), 10);
                    if (isNaN(markValue)) {
                        callback();
                        return;
                    }
                    var mark = {
                        quizAttemptId: activeQuizAttempt._id,
                        value: markValue,
                        method: "MOUSOKU",
                    };
                    bridge.sendXhrRequest("POST", "/api/admin/mark", mark, function () {
                        callback();
                    }, function (textStatus, errorThrown) {
                        alert(errorThrown);
                    });
                };
                var index = 0;
                if (quizAttemptId) {
                    for (var i = 0; i < data.quizAttempt_users.length; ++i) {
                        if (data.quizAttempt_users[i]._id === quizAttemptId) {
                            index = i;
                            break;
                        }
                    }
                }
                $numberOfSessions.text(data.quizAttempt_users.length);
                loadSession(index);
                $(window).on("keydown", function (e) {
                    switch (e.keyCode) {
                        case 65:
                        case 37:
                            saveMark(function () {
                                if (--index < 0) {
                                    index = 0;
                                }
                                loadSession(index);
                            });
                            break;
                        case 68:
                        case 39:
                            saveMark(function () {
                                if (++index >= data.quizAttempt_users.length) {
                                    index = data.quizAttempt_users.length - 1;
                                }
                                loadSession(index);
                            });
                            break;
                        case 36:
                            index = 0;
                            loadSession(index);
                            break;
                        case 35:
                            index = data.quizAttempt_users.length - 1;
                            loadSession(index);
                            break;
                        case 33:
                            {
                                var currentChatGroupId = data.quizAttempt_chatGroup[activeQuizAttempt._id]._id;
                                while (index-- > 0) {
                                    if (data.quizAttempt_chatGroup[data.quizAttempt_users[index]._id]._id !== currentChatGroupId) {
                                        break;
                                    }
                                }
                                if (index < 0) {
                                    index = 0;
                                }
                                loadSession(index);
                            }
                            break;
                        case 34:
                            {
                                var currentChatGroupId = data.quizAttempt_chatGroup[activeQuizAttempt._id]._id;
                                while (index++ < (data.quizAttempt_users.length - 1)) {
                                    if (data.quizAttempt_chatGroup[data.quizAttempt_users[index]._id]._id !== currentChatGroupId) {
                                        break;
                                    }
                                }
                                if (index >= data.quizAttempt_users.length) {
                                    index = data.quizAttempt_users.length - 1;
                                }
                                loadSession(index);
                            }
                            break;
                        case 87:
                        case 38:
                            {
                                if ($markValue.hasClass("saved")) {
                                    showMessagePressInsertToEdit();
                                    return;
                                }
                                var markValue = parseInt($markValue.text(), 10);
                                if (isNaN(markValue)) {
                                    return;
                                }
                                if (++markValue > 4) {
                                    markValue = 4;
                                }
                                $markValue.removeClass().addClass("edit-mode").text(markValue);
                            }
                            break;
                        case 83:
                        case 40:
                            {
                                if ($markValue.hasClass("saved")) {
                                    showMessagePressInsertToEdit();
                                    return;
                                }
                                var markValue = parseInt($markValue.text(), 10);
                                if (isNaN(markValue)) {
                                    return;
                                }
                                if (--markValue < 0) {
                                    markValue = 0;
                                }
                                $markValue.removeClass().addClass("edit-mode").text(markValue);
                            }
                            break;
                        case 45:
                            $markValue.removeClass().addClass("edit-mode");
                            break;
                        case 71:
                            $buttonGoToPage.trigger("click");
                            break;
                    }
                });
                $markingChatsOverviewBar.on("mousemove", function (e) {
                    var target = e.target;
                    if ($.contains($markingChatsOverviewBar[0], target)) {
                        $(target).addClass("hover").siblings().removeClass("hover");
                    }
                    var mousePosYPX = e.pageY - $markingChatsOverviewBar_OffsetTop;
                    var deadZone = ($markingChatsOverviewBar_Height * $markingChatsOverviewBar_Height) / (2 * $markingChats_ScrollHeight);
                    var scrollTop;
                    if (2 * deadZone >= $markingChatsOverviewBar_Height) {
                        scrollTop = 0;
                    }
                    else if (mousePosYPX <= deadZone) {
                        scrollTop = 0;
                    }
                    else if (mousePosYPX >= ($markingChatsOverviewBar_Height - deadZone)) {
                        scrollTop = $markingChats_ScrollHeight;
                    }
                    else {
                        var availableY = $markingChatsOverviewBar_Height - (2 * deadZone);
                        scrollTop = ((mousePosYPX - deadZone) / availableY) * ($markingChats_ScrollHeight - $markingChatsOverviewBar_Height);
                    }
                    $markingChats.scrollTop(scrollTop);
                });
                $(window).on("resize", function () {
                    updateMarkingChatsDimensionsCache();
                });
                $("#toggle-left-hand").on("click", toggleLeftHandMode);
                $buttonToggleDiffRemovedVisible.on("click", toggleDiffRemovedVisibleMode);
                $buttonToggleDiffAddedVisible.on("click", toggleDiffAddedVisibleMode);
                $("#toggle-traditional-scroll-chats").on("click", toggleTraditionalScrollChatsMode);
                $buttonToggleNoBg.on("click", toggleNoBg);
                $buttonGoToPage.on("click", function () {
                    if ($markValue.hasClass("edit-mode")) {
                        alert("Please commit mark first");
                        return;
                    }
                    var page = prompt("Go to...", (index + 1).toString());
                    if (page) {
                        loadSession(parseInt(page, 10) - 1);
                    }
                });
                $buttonLookupSession.on("click", function () {
                    if ($markValue.hasClass("edit-mode")) {
                        alert("Please commit mark first");
                        return;
                    }
                    var quizAttemptId = prompt("Quiz Attempt ID?");
                    if (quizAttemptId) {
                        var foundRecords = data.quizAttempt_users.filter(function (x) { return x._id === quizAttemptId; });
                        if (foundRecords.length === 0) {
                            alert("Not found");
                            return;
                        }
                        loadSession(data.quizAttempt_users.indexOf(foundRecords[0]));
                    }
                });
                $buttonLookupUser.on("click", function () {
                    if ($markValue.hasClass("edit-mode")) {
                        alert("Please commit mark first");
                        return;
                    }
                    var username = prompt("Username?");
                    if (username) {
                        var foundRecords = data.quizAttempt_users.filter(function (x) { return x._user.username === username; });
                        if (foundRecords.length === 0) {
                            alert("Session with username not found");
                            return;
                        }
                        if (foundRecords.length > 1) {
                            alert("Multiple pages with username '" + username + "':\n" + foundRecords.map(function (x) { return data.quizAttempt_users.indexOf(x) + 1; }).join("\n"));
                            return;
                        }
                        loadSession(data.quizAttempt_users.indexOf(foundRecords[0]));
                    }
                });
                $("button").on("click", function (e) {
                    $(e.currentTarget).blur();
                });
                $exitButton.on("click", function (e) {
                    if ($markValue.hasClass("edit-mode")) {
                        if (!confirm("Mark not yet committed - leave now?")) {
                            return;
                        }
                    }
                    location.assign("./actions.html");
                });
            });
        };
        fetchData(onUserSessionsLoaded);
    })();
});
