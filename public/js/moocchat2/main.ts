/*
 * MOOCchat
 * Main module
 * 
 * Main JS module that handles the startup of MOOCchat
 */

import $ = require("jquery");

import {Utils} from "./Utils";
import {TaskSection} from "./TaskSection";
import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager} from "./TaskSectionManager";

import {MoocchatState as STATE} from "./MoocchatStates";
    
import {WelcomePageFunc} from "./pages/welcome";
import {InitialAnswerPageFunc} from "./pages/initial-answer";
import {AwaitGroupFormationPageFunc} from "./pages/await-group-formation";
import {DiscussionPageFunc} from "./pages/discussion";
import {RevisedAnswerPageFunc} from "./pages/revised-answer";
import {SurveyPageFunc} from "./pages/survey";

// On DOM Ready
$(() => {
    let $header = $("#header");
    let $courseName = $("#course-name");
    let $taskSections = $("#task-sections");
    let $content = $("#content");

    let stateMachine = new StateFlow<STATE>();
    let pageManager = new PageManager($content);
    let secManager = new TaskSectionManager($taskSections);


    // TODO: Should be somehow processing information that comes from Blackboard/LTI here
    $courseName.text("ENGG1200");



    // Sections must be defined now before other resources use them
    let sectionDefinitions = [
        // [id, name, milliseconds?]
        ["welcome", "Welcome"],
        ["initial-answer", "Initial Answer", Utils.DateTime.secToMs(15 * 60)],
        ["discussion", "Discussion", Utils.DateTime.secToMs(15 * 60)],
        ["revised-answer", "Revised Answer", Utils.DateTime.secToMs(6 * 60)],
        ["survey", "Survey"]
    ];

    secManager.registerAll(sectionDefinitions);

    // Individual page handling code
    let welcomePage = WelcomePageFunc(stateMachine, pageManager, secManager);
    let initialAnswerPage = InitialAnswerPageFunc(stateMachine, pageManager, secManager);
    let awaitGroupFormationPage = AwaitGroupFormationPageFunc(stateMachine, pageManager, secManager);
    let discussionPage = DiscussionPageFunc(stateMachine, pageManager, secManager);
    let revisedAnswerPage = RevisedAnswerPageFunc(stateMachine, pageManager, secManager);
    let surveyPage = SurveyPageFunc(stateMachine, pageManager, secManager);

    stateMachine.registerAll([
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
    stateMachine.goTo(STATE.WELCOME);
});
