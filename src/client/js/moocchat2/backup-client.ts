import {conf} from "./conf";

import * as $ from "jquery";

import {TaskSectionDefinition} from "./classes/TaskSectionManager";
import {WebsocketManager, WebsocketEvents} from "./classes/Websockets";

import {MoocchatSession} from "./classes/MoocchatSession";
import {MoocchatAnalytics} from "./classes/MoocchatAnalytics";
import {MoocchatUser} from "./classes/MoocchatUser";
import {MoocchatQuiz} from "./classes/MoocchatQuiz";

import {MoocchatState as STATE} from "./classes/MoocchatStates";

import {WelcomePageFunc} from "./pages/welcome";
import {InitialAnswerPageFunc} from "./pages/initial-answer";
import {AwaitGroupFormationPageFunc} from "./pages/await-group-formation";
import {DiscussionPageFunc} from "./pages/discussion";
import {RevisedAnswerPageFunc} from "./pages/revised-answer";
import {SurveyPageFunc} from "./pages/survey";

import {ILTIBasicLaunchData} from "./classes/ILTIBasicLaunchData";
import {IEventData_BackupClientEnterQueueState, IEventData_ClientPoolCountUpdate, IEventData_BackupClientQueueUpdate, IEventData_ChatGroupFormed} from "./classes/IEventData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

/*
 * MOOCchat
 * Backup-client module
 * 
 * Main JS module for backup clients (e.g. tutor/instructors in backup queue)
 */

// Start Websockets as soon as possible
let socket = new WebsocketManager();
socket.open();

// On DOM Ready
$(() => {
    let $header = $("#header");
    let $courseName = $("#course-name");
    let $taskSections = $("#task-sections");
    let $content = $("#content");

    // TODO: Need to make MoocchatSession easier to use as it's a
    // bit opaque as to what the $xxx elements are 
    let session = new MoocchatSession<STATE>(false, $content, $taskSections).setSocket(socket);


    // Sections must be defined now before other resources use them
    let sectionDefinitions: TaskSectionDefinition[] = [
        // [id, name, milliseconds]
        ["welcome", "Welcome"],
        ["backup-client-answer", "Provide Answer"],
        ["backup-client-wait", "Wait To Be Called"],
        ["discussion", "Discussion", conf.timings.initialAnswerMs],
        ["backup-client-logout", "Log Out"]
    ];

    session.sectionManager.registerAll(sectionDefinitions);

    // Individual page handling code
    let welcomePage = WelcomePageFunc(session);
    let discussionPage = DiscussionPageFunc(session);

    session.stateMachine.registerAll([
        {   // Startup
            state: STATE.STARTUP,
            onEnter: () => {
                if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined") {
                    // No LTI data detected
                    session.stateMachine.goTo(STATE.NO_LTI_DATA);
                    session.analytics.trackEvent("MOOCCHAT", "NO_LTI_DATA");
                } else {
                    // $courseName.text(_LTI_BASIC_LAUNCH_DATA.lis_course_section_sourcedid.split("_")[0]);
                    $courseName.text("ENGG1200 Backup Queue");
                    session.stateMachine.goTo(STATE.LOGIN);
                    session.analytics.trackEvent("MOOCCHAT", "START");
                }
            }
        },
        {   // No LTI data
            state: STATE.NO_LTI_DATA,
            onEnter: () => {
                session.pageManager.loadPage("no-lti-data");
            }
        },
        {
            state: STATE.LOGIN,
            onEnter: () => {
                let user = new MoocchatUser(session.eventManager, _LTI_BASIC_LAUNCH_DATA);

                user.onLoginSuccess = (data) => {
                    session.setQuiz(new MoocchatQuiz(data.quiz));
                    session.setUser(user);
                    session.sessionId = data.sessionId;
                    session.stateMachine.goTo(STATE.WELCOME, { nextState: STATE.BACKUP_CLIENT_ANSWER });
                }

                user.onLoginFail = (data) => {
                    let reason: string;

                    if (typeof data === "string") {
                        // General login failure
                        reason = data;
                    } else {
                        // Login failed because user still signed in
                        reason = `User "${data.username}" is still signed in`;
                    }

                    session.stateMachine.goTo(STATE.INVALID_LOGIN, { reason: reason });
                }

                user.login(session.socket);
            }
        },
        {   // Invalid login
            state: STATE.INVALID_LOGIN,
            onEnter: (data) => {
                session.pageManager.loadPage("invalid-login", (page$) => {
                    page$("#reason").text(data.reason);
                });
            }
        },
        {   // Welcome
            state: STATE.WELCOME,
            onEnter: welcomePage.onEnter,
            onLeave: welcomePage.onLeave
        },
        {   // Instructor answer to question/Backup queue answer
            state: STATE.BACKUP_CLIENT_ANSWER,
            onEnter: () => {
                let section = session.sectionManager.getSection("backup-client-answer");
                let maxJustificationLength = conf.answers.justification.maxLength;

                session.socket.once(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data: IEventData_BackupClientEnterQueueState) => {
                    if (data.success) {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                function submitAnswerAndJoinQueue(answer: number, justification: string) {
                    session.answers.initial.answer = answer;
                    session.answers.initial.justification = justification.substr(0, maxJustificationLength);

                    session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE, {
                        sessionId: session.sessionId,
                        answer: session.answers.initial.answer,
                        justification: session.answers.initial.justification
                    });
                }

                // Reuse initial answer page for backup queue answer submission
                session.pageManager.loadPage("initial-answer", (page$) => {
                    section.setActive();

                    let $answers = page$("#answers");
                    // let $answersUL = page$("#answers > ul");
                    let $justification = page$("#justification");
                    let $submitAnswer = page$(".submit-answer-button");
                    let $charAvailable = page$("#char-available");

                    $submitAnswer.on("click", () => {
                        let justification = $.trim($justification.val());
                        let answer = page$("#answers > .selected").index();

                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer and justification.");
                            return;
                        }

                        if (justification.length > maxJustificationLength) {
                            alert("Justification is too long. Reduce your justification length.");
                            return;
                        }

                        submitAnswerAndJoinQueue(answer, justification);
                    });

                    $answers.on("click", "button", function(e) {
                        e.preventDefault();

                        $("button", $answers).removeClass("selected");

                        $(this).addClass("selected");
                    });

                    $justification.on("change input", () => {
                        let charRemaining = maxJustificationLength - $.trim($justification.val()).length;

                        $charAvailable.text(charRemaining);

                        if (charRemaining < 0) {
                            $charAvailable.addClass("invalid");
                        } else {
                            $charAvailable.removeClass("invalid");
                        }
                    }).trigger("input");


                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);

                    let answerDOMs: JQuery[] = [];
                    session.quiz.questionChoices.forEach((choice) => {
                        answerDOMs.push($("<button>").text(choice));
                    });

                    $answers.append(answerDOMs);
                });
            },
            onLeave: () => {
                let section = session.sectionManager.getSection("backup-client-answer");
                section.unsetActive();
            }
        },
        {   // Wait to be called/Backup client wait
            state: STATE.BACKUP_CLIENT_WAIT,
            onEnter: () => {
                let section = session.sectionManager.getSection("backup-client-wait");
                session.pageManager.loadPage("backup-client-wait", (page$) => {
                    section.setActive();

                    var $backupClientQueue = page$("ul#backup-client-queue");
                    var $numOfClientsInPool = page$("span#number-of-clients-in-pool");

                    function onBackupClientQueueUpdate(data: IEventData_BackupClientQueueUpdate) {
                        $backupClientQueue.empty();

                        data.clients.forEach(function(client) {
                            var $backupClientLI = $("<li>").text(client.username);

                            if (client.username === session.user.username) {
                                $backupClientLI.css("font-weight", "bold");
                            }

                            $backupClientLI.appendTo($backupClientQueue);
                        });
                    }

                    function onClientPoolCountUpdate(data: IEventData_ClientPoolCountUpdate) {
                        $numOfClientsInPool.text(data.numberOfClients);

                        // Play tone if fewer than 2 remain to get people's attention
                        if (data.numberOfClients < 2) {
                            // https://notificationsounds.com/message-tones/mission-accomplished-252
                            var notificationTone = new Audio("./mp3/mission-accomplished.mp3");
                            notificationTone.play();
                        }
                    }

                    let countdownIntervalHandle: number;

                    function onBackupClientTransferCall() {
                        var $transferConfirmBox = page$("#transfer-confirmation");
                        var $transferCountdown = page$("#transfer-remaining-seconds");

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
                            session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_TRANSFER_CONFIRM, { sessionId: session.sessionId });

                            session.socket.once(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, function(data: IEventData_ChatGroupFormed) {
                                session.stateMachine.goTo(STATE.DISCUSSION, data);
                            });
                        });

                        // https://notificationsounds.com/message-tones/mission-accomplished-252
                        var notificationTone = new Audio("./mp3/mission-accomplished.mp3");
                        notificationTone.play();
                    }

                    // Attach socket listeners to queue and pool status
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_QUEUE_UPDATE, onBackupClientQueueUpdate);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE, onClientPoolCountUpdate);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_TRANSFER_CALL, onBackupClientTransferCall);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_EJECTED, () => { session.stateMachine.goTo(STATE.BACKUP_CLIENT_EJECTED); });

                    // Request information now (once only)
                    session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_STATUS_REQUEST, { sessionId: session.sessionId });

                    page$("#logout").on("click", () => {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_LOGOUT);
                    });
                });
            },
            onLeave: () => {
                let section = session.sectionManager.getSection("backup-client-wait");
                section.unsetActive();

                // Detach listeners
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_QUEUE_UPDATE);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_TRANSFER_CALL);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_EJECTED);

            }
        },
        {   // Discussion
            state: STATE.DISCUSSION,
            onEnter: discussionPage.onEnter,
            onLeave: discussionPage.onLeave
        },
        {   // TODO: Temporary measure so that the discussion then moves back to WAIT for backup clients
            state: STATE.REVISED_ANSWER,
            onEnter: () => {
                // Must re-register to return to the queue
                session.socket.once(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data: IEventData_BackupClientEnterQueueState) => {
                    if (data.success) {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_RETURN_TO_QUEUE, { sessionId: session.sessionId });
            }
        },
        {   // Ejected
            state: STATE.BACKUP_CLIENT_EJECTED,
            onEnter: () => {
                // Log out by closing socket
                session.socket.close();

                let section = session.sectionManager.getSection("backup-client-logout");
                session.pageManager.loadPage("backup-client-ejected", (page$) => {
                    section.setActive();

                    page$("#login-again").on("click", () => {
                        session.socket.open();
                        session.stateMachine.goTo(STATE.LOGIN);
                    });

                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            },
            onLeave: () => {
                let section = session.sectionManager.getSection("backup-client-logout");
                section.unsetActive();
            }
        },
        {   // Logout
            state: STATE.BACKUP_CLIENT_LOGOUT,
            onEnter: () => {
                // Log out by closing socket
                session.socket.close();

                let section = session.sectionManager.getSection("backup-client-logout");
                session.pageManager.loadPage("backup-client-logout", (page$) => {
                    section.setActive();
                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        }
    ]);

    // Start the state machine
    session.stateMachine.goTo(STATE.STARTUP);

});
