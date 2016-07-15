import {conf} from "./conf";

import * as $ from "jquery";

import {WebsocketManager} from "./classes/WebsocketManager";

import {MoocchatSession} from "./classes/MoocchatSession";

import {MoocchatState as STATE} from "./classes/MoocchatStates";



import {StartupStateHandler} from "./state-handlers/startup";
import {LoginStateHandler} from "./state-handlers/login";
import {WelcomeStateHandler} from "./state-handlers/welcome";
import {InitialAnswerStateHandler} from "./state-handlers/initial-answer";
import {AwaitGroupFormationStateHandler} from "./state-handlers/await-group-formation";
import {DiscussionStateHandler} from "./state-handlers/discussion";
import {RevisedAnswerStateHandler} from "./state-handlers/revised-answer";
import {SurveyStateHandler} from "./state-handlers/survey";
import {CompletionStateHandler} from "./state-handlers/completion";

import {NoLtiDataStateHandler} from "./state-handlers/no-lti-data";
import {InvalidLoginStateHandler} from "./state-handlers/invalid-login";


/*
 * MOOCchat
 * Main module
 * 
 * Main JS module that handles the startup of MOOCchat
 */


// Warn when someone is about to leave MOOCchat (maybe accidentally...)
const windowUnloadWarning = (event: BeforeUnloadEvent) => {
    const dialogText = `Your MOOCchat session will end prematurely if you leave now.`;
    event.returnValue = dialogText;
    return dialogText;
}

window.addEventListener("beforeunload", windowUnloadWarning);


// Start Websockets as soon as possible
const socket = new WebsocketManager();
socket.open();


// On DOM Ready
$(() => {
    const $header = $("#header");
    const $courseName = $("#course-name");
    const $taskSections = $("#task-sections");
    const $content = $("#content");

    // TODO: Need to make MoocchatSession easier to use as it's a
    // bit opaque as to what the $xxx elements are 
    const session = new MoocchatSession<STATE>(true, $content, $taskSections).setSocket(socket);


    // Send event on any button click
    $content.on("click", "button, input[type=button]", (e) => {
        const $elem = $(e.currentTarget);
        session.analytics.trackEvent("BUTTON_CLICK", $elem.text() || $elem.val());
    });


    // Sections must be defined now before other resources use them
    session.sectionManager.registerAll([
        // [id, name, milliseconds]
        ["welcome", "Welcome"],
        ["initial-answer", "Initial Answer", conf.timings.initialAnswerMs],
        ["await-group-formation", "Forming Group"],
        ["discussion", "Discussion", conf.timings.discussionMs],
        ["revised-answer", "Revised Answer", conf.timings.revisedAnswerMs],
        ["survey", "Survey"],
        ["finish", "Finish"]
    ]);


    // Individual state handlers
    const startupState = StartupStateHandler(session, $courseName);
    const loginState = LoginStateHandler(session);
    const welcomeState = WelcomeStateHandler(session);
    const initialAnswerState = InitialAnswerStateHandler(session);
    const awaitGroupFormationState = AwaitGroupFormationStateHandler(session);
    const discussionState = DiscussionStateHandler(session);
    const revisedAnswerState = RevisedAnswerStateHandler(session);
    const surveyState = SurveyStateHandler(session);
    const completionState = CompletionStateHandler(session, windowUnloadWarning);

    const noLtiDataState = NoLtiDataStateHandler(session, $courseName);
    const invalidLoginState = InvalidLoginStateHandler(session);

    session.stateMachine.registerAll([
        {   // Startup
            state: STATE.STARTUP,
            onEnter: startupState.onEnter
        },
        {   // No LTI data
            state: STATE.NO_LTI_DATA,
            onEnter: noLtiDataState.onEnter
        },
        {   // Login
            state: STATE.LOGIN,
            onEnter: loginState.onEnter
        },
        {   // Invalid login
            state: STATE.INVALID_LOGIN,
            onEnter: invalidLoginState.onEnter
        },
        {   // Welcome
            state: STATE.WELCOME,
            onEnter: welcomeState.onEnter,
            onLeave: welcomeState.onLeave
        },
        {   // Initial answer
            state: STATE.INITIAL_ANSWER,
            onEnter: initialAnswerState.onEnter,
            onLeave: initialAnswerState.onLeave
        },
        {   // Await group formation
            state: STATE.AWAIT_GROUP_FORMATION,
            onEnter: awaitGroupFormationState.onEnter,
            onLeave: awaitGroupFormationState.onLeave
        },
        {   // Discussion
            state: STATE.DISCUSSION,
            onEnter: discussionState.onEnter,
            onLeave: discussionState.onLeave
        },
        {   // Revised answer
            state: STATE.REVISED_ANSWER,
            onEnter: revisedAnswerState.onEnter,
            onLeave: revisedAnswerState.onLeave
        },
        {   // Survey
            state: STATE.SURVEY,
            onEnter: surveyState.onEnter,
            onLeave: surveyState.onLeave
        },
        {   // Completion
            state: STATE.COMPLETION,
            onEnter: completionState.onEnter
        }
    ]);

    // Start the state machine
    session.stateMachine.goTo(STATE.STARTUP);

});
