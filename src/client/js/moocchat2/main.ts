import * as $ from "jquery";

import {Utils} from "./classes/Utils";

import {TaskSectionDefinition} from "./classes/TaskSectionManager";
import {WebsocketManager} from "./classes/Websockets";

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
        ["initial-answer", "Initial Answer", Utils.DateTime.secToMs(15 * 60)],
        ["await-group-formation", "Forming Group"],
        ["discussion", "Discussion", Utils.DateTime.secToMs(15 * 60)],
        ["revised-answer", "Revised Answer", Utils.DateTime.secToMs(6 * 60)],
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
        $courseName.text("ENGG1200");
        session.stateMachine.goTo(STATE.STARTUP_LOGIN);
        session.analytics.trackEvent("MOOCCHAT", "START");
    }

});
