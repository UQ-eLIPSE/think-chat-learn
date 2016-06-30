import * as $ from "jquery";

import {Utils} from "./classes/Utils";

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
import {IEventData_BackupClientEnterQueueState} from "./classes/IEventData";

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
        ["discussion", "Discussion", Utils.DateTime.secToMs(15 * 60)],
        ["finish", "Finish"]
    ];

    session.sectionManager.registerAll(sectionDefinitions);

    // Individual page handling code
    let welcomePage = WelcomePageFunc(session);
    let discussionPage = DiscussionPageFunc(session);

    session.stateMachine.registerAll([
        {   // No LTI data
            state: STATE.NO_LTI_DATA,
            onEnter: () => {
                session.pageManager.loadPage("no-lti-data");
            }
        },
        {
            state: STATE.STARTUP_LOGIN,
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

                session.socket.once(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data: IEventData_BackupClientEnterQueueState) => {
                    if (data.success) {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                function submitAnswerAndJoinQueue(answer: number, justification: string) {
                    session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE, {
                        sessionId: session.sessionId,
                        answer: answer,
                        justification: justification
                    });
                }

                // Reuse initial answer page for backup queue answer submission
                session.pageManager.loadPage("initial-answer", (page$) => {
                    section.setActive();

                    page$("#submit-answer").on("click", () => {
                        let justification = $.trim(page$("#answer-justification").val());
                        let answer = page$("#answers > ul > li.selected").index();

                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer.");
                            return;
                        }

                        submitAnswerAndJoinQueue(answer, justification);
                    });


                    let $answers = page$("#answers");

                    $answers.on("click", "li", function(e) {
                        e.preventDefault();

                        $("li", $answers).removeClass("selected");

                        $(this).addClass("selected");
                    });


                    let $answersUL = page$("#answers > ul");

                    let answerDOMs: JQuery[] = [];

                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);

                    session.quiz.questionChoices.forEach((choice) => {
                        answerDOMs.push($("<li>").text(choice));
                    });

                    $answersUL.append(answerDOMs);
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
                });
            },
            onLeave: () => {
                let section = session.sectionManager.getSection("backup-client-wait");
                section.unsetActive();
            }
        },
        {   // Discussion
            state: STATE.DISCUSSION,
            onEnter: discussionPage.onEnter,
            onLeave: discussionPage.onLeave
        },
        {   // Confirmation/receipt
            state: STATE.CONFIRMATION,
            onEnter: () => {
                session.analytics.trackEvent("MOOCCHAT", "FINISH");
            }
        }
    ]);

    // Start the state machine
    if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined") {
        // No LTI data detected
        session.stateMachine.goTo(STATE.NO_LTI_DATA);
        session.analytics.trackEvent("MOOCCHAT", "NO_LTI_DATA");
    } else {
        // $courseName.text(_LTI_BASIC_LAUNCH_DATA.lis_course_section_sourcedid.split("_")[0]);
        $courseName.text("ENGG1200 Backup Queue");
        session.stateMachine.goTo(STATE.STARTUP_LOGIN);
        session.analytics.trackEvent("MOOCCHAT", "START");
    }

});
