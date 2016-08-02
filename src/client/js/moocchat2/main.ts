import {conf} from "./conf";

import * as $ from "jquery";

import {WebsocketManager} from "./classes/WebsocketManager";

import {MoocchatSession} from "./classes/MoocchatSession";

import {MoocchatState as STATE} from "./classes/MoocchatStates";

import {VirtServerComms} from "./classes/VirtServerComms";


import {StartupStateHandler} from "./state-handlers/startup";
import {LoginStateHandler} from "./state-handlers/login";
import {ConsentFormStateHandler} from "./state-handlers/consent-form";
import {SetResearchConsentStateHandler} from "./state-handlers/set-research-consent";
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
// Unfortunately most browsers now ignore the text and give a generic message instead,
// but a non-void return is still required to trigger the warning dialog.
const windowUnloadWarning = (event: BeforeUnloadEvent) => {
    const dialogText = `Your MOOCchat session will end prematurely if you leave now.`;
    event.returnValue = dialogText;
    return dialogText;
}

window.addEventListener("beforeunload", windowUnloadWarning);


// Start server communications
const virtServerComms = new VirtServerComms();
virtServerComms.open();


// On DOM Ready
$(() => {
    const $header = $("#header");
    const $courseName = $("#course-name");
    const $taskSections = $("#task-sections");
    const $content = $("#content");
    const $blackboardOpen = $("#blackboard-open");

    const session = new MoocchatSession<STATE>($content, $taskSections).setSocket(virtServerComms);


    // Track errors
    window.addEventListener("error", (e: ErrorEvent) => {
        const errMsg = e.message;
        const errFile = e.filename || "";
        const errLine = e.lineno || "";

        const errFilePlusLine = ((errFile.length > 0) ? `${errFile}:${errLine}` : "");

        session.analytics.trackEvent("JS_ERROR", errMsg, errFilePlusLine);
    });

    // Send event on any button click
    $("body").on("click", "button, input[type=button]", (e) => {
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
    const startupState = StartupStateHandler(session, STATE.LOGIN, $courseName, $blackboardOpen);
    const loginState = LoginStateHandler(session, STATE.WELCOME, STATE.CONSENT_FORM);
    const consentFormState = ConsentFormStateHandler(session);
    const setResearchConsentState = SetResearchConsentStateHandler(session);
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
        {   // Consent form
            state: STATE.CONSENT_FORM,
            onEnter: consentFormState.onEnter
        },
        {   // Set research consent
            state: STATE.SET_RESEARCH_CONSENT,
            onEnter: setResearchConsentState.onEnter
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
