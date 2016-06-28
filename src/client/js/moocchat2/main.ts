import * as $ from "jquery";

import {Utils} from "./Utils";
import {TaskSection} from "./TaskSection";
import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager, TaskSectionDefinition} from "./TaskSectionManager";
import {WebsocketManager} from "./Websockets";

import {MoocchatSession} from "./MoocchatSession";

import {MoocchatState as STATE} from "./MoocchatStates";

import {WelcomePageFunc} from "./pages/welcome";
import {InitialAnswerPageFunc} from "./pages/initial-answer";
import {AwaitGroupFormationPageFunc} from "./pages/await-group-formation";
import {DiscussionPageFunc} from "./pages/discussion";
import {RevisedAnswerPageFunc} from "./pages/revised-answer";
import {SurveyPageFunc} from "./pages/survey";

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

    let session =
        new MoocchatSession<STATE>()
            .setStateMachine(new StateFlow<STATE>())
            .setPageManager(new PageManager($content))
            .setSectionManager(new TaskSectionManager($taskSections))
            .setSocket(socket);



    // TODO: Should be somehow processing information that comes from Blackboard/LTI here
    $courseName.text("ENGG1200");



    // Sections must be defined now before other resources use them
    let sectionDefinitions: TaskSectionDefinition[] = [
        // [id, name, milliseconds]
        ["welcome", "Welcome"],
        ["initial-answer", "Initial Answer", Utils.DateTime.secToMs(15 * 60)],
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
            state: STATE.CONFIRMATION
        }
    ]);

    // Start the state machine
    session.stateMachine.goTo(STATE.WELCOME);
});
