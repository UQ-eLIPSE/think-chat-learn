import {conf} from "./conf";

import * as $ from "jquery";

import {TaskSectionDefinition} from "./classes/TaskSectionManager";
import {WebsocketEvents, WebsocketManager} from "./classes/Websockets";

import {MoocchatSession} from "./classes/MoocchatSession";
import {MoocchatAnalytics} from "./classes/MoocchatAnalytics";
import {MoocchatUser} from "./classes/MoocchatUser";
import {MoocchatQuiz} from "./classes/MoocchatQuiz";
import {MoocchatSurvey} from "./classes/MoocchatSurvey";

import {MoocchatState as STATE} from "./classes/MoocchatStates";

import {WelcomePageFunc} from "./pages/welcome";
import {InitialAnswerPageFunc} from "./pages/initial-answer";
import {AwaitGroupFormationPageFunc} from "./pages/await-group-formation";
import {DiscussionPageFunc} from "./pages/discussion";
import {RevisedAnswerPageFunc} from "./pages/revised-answer";
import {SurveyPageFunc} from "./pages/survey";

import {ILTIBasicLaunchData} from "./classes/ILTIBasicLaunchData";
// import {IEventData_SessionAvailableStatus} from "./classes/IEventData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

/*
 * MOOCchat
 * Main module
 * 
 * Main JS module that handles the startup of MOOCchat
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
    let session = new MoocchatSession<STATE>(true, $content, $taskSections).setSocket(socket);


    // Send event on any button click
    $content.on("click", "button, input[type=button]", (e) => {
        let $elem = $(e.currentTarget);
        session.analytics.trackEvent("BUTTON_CLICK", $elem.text() || $elem.val());
    });


    // Sections must be defined now before other resources use them
    let sectionDefinitions: TaskSectionDefinition[] = [
        // [id, name, milliseconds]
        ["welcome", "Welcome"],
        ["initial-answer", "Initial Answer", conf.timings.initialAnswerMs],
        ["await-group-formation", "Forming Group"],
        ["discussion", "Discussion", conf.timings.discussionMs],
        ["revised-answer", "Revised Answer", conf.timings.revisedAnswerMs],
        ["survey", "Survey"],
        ["finish", "Finish"]
    ];

    session.sectionManager.registerAll(sectionDefinitions);

    // Individual page handling code
    let welcomePage = WelcomePageFunc(session);
    let initialAnswerPage = InitialAnswerPageFunc(session);
    let awaitGroupFormationPage = AwaitGroupFormationPageFunc(session);
    let discussionPage = DiscussionPageFunc(session);
    let revisedAnswerPage = RevisedAnswerPageFunc(session);
    let surveyPage = SurveyPageFunc(session);

    session.stateMachine.registerAll([
        {   // Startup
            state: STATE.STARTUP,
            onEnter: () => {
                if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined") {
                    // No LTI data detected
                    session.stateMachine.goTo(STATE.NO_LTI_DATA);
                    session.analytics.trackEvent("MOOCCHAT", "NO_LTI_DATA");
                } else {
                    // session.socket.emit(WebsocketEvents.OUTBOUND.SESSION_AVAILABLE_CHECK);
                    // session.socket.once(WebsocketEvents.INBOUND.SESSION_AVAILABLE_STATUS, (data: IEventData_SessionAvailableStatus) => {
                    //     if (data.available) {
                    // $courseName.text(_LTI_BASIC_LAUNCH_DATA.lis_course_section_sourcedid.split("_")[0]);
                    $courseName.text("ENGG1200");
                    session.stateMachine.goTo(STATE.LOGIN);
                    session.analytics.trackEvent("MOOCCHAT", "START");
                    //     } else {
                    //         session.stateMachine.goTo(STATE.SESSION_NOT_AVAILABLE);
                    //     }
                    // });
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
                    session
                        .setId(data.sessionId)
                        .setQuiz(new MoocchatQuiz(data.quiz))
                        .setSurvey(new MoocchatSurvey(data.survey))
                        .setUser(user);
                        
                    session.stateMachine.goTo(STATE.WELCOME);
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
        {   // Session not available
            state: STATE.SESSION_NOT_AVAILABLE,
            onEnter: () => {
                session.pageManager.loadPage("session-not-available", (page$) => {
                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        },
        {   // Welcome
            state: STATE.WELCOME,
            onEnter: welcomePage.onEnter,
            onLeave: welcomePage.onLeave
        },
        {   // Initial answer
            state: STATE.INITIAL_ANSWER,
            onEnter: initialAnswerPage.onEnter,
            onLeave: initialAnswerPage.onLeave
        },
        {   // Await group formation
            state: STATE.AWAIT_GROUP_FORMATION,
            onEnter: awaitGroupFormationPage.onEnter,
            onLeave: awaitGroupFormationPage.onLeave
        },
        {   // Discussion
            state: STATE.DISCUSSION,
            onEnter: discussionPage.onEnter,
            onLeave: discussionPage.onLeave
        },
        {   // Revised answer
            state: STATE.REVISED_ANSWER,
            onEnter: revisedAnswerPage.onEnter,
            onLeave: revisedAnswerPage.onLeave
        },
        {   // Survey
            state: STATE.SURVEY,
            onEnter: surveyPage.onEnter,
            onLeave: surveyPage.onLeave
        },
        {   // Completion
            state: STATE.COMPLETION,
            onEnter: () => {
                session.analytics.trackEvent("MOOCCHAT", "FINISH");

                let section = session.sectionManager.getSection("finish");
                session.pageManager.loadPage("completion", (page$) => {
                    section.setActive();

                    // Session ID is split every 4th character to make it easier to read
                    page$("#session-id").text(session.id.match(/.{1,4}/g).join(" "));
                    // page$("#time-now").text(new Date().toISOString());

                    page$("#print-receipt").on("click", () => {
                        window.print();
                    });

                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });

                    let initialAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.initial.optionId)[0];
                    let revisedAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.revised.optionId)[0];

                    page$("#initial-answer-content").html(initialAnswer.content);
                    page$("#initial-answer-justification").text(session.answers.initial.justification);

                    page$("#revised-answer-content").html(revisedAnswer.content);
                    page$("#revised-answer-justification").text(session.answers.revised.justification);
                });
            }
        }
    ]);

    // Start the state machine
    session.stateMachine.goTo(STATE.STARTUP);

});
