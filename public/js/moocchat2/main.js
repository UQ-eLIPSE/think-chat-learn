define(["require", "exports", "jquery", "./Utils", "./StateFlow", "./PageManager", "./TaskSectionManager", "./MoocchatStates", "./pages/welcome", "./pages/initial-answer", "./pages/await-group-formation", "./pages/discussion", "./pages/revised-answer", "./pages/survey"], function (require, exports, $, Utils, StateFlow, PageManager, TaskSectionManager, STATE, WelcomePageFunc, InitialAnswerPageFunc, AwaitGroupFormationPageFunc, DiscussionPageFunc, RevisedAnswerPageFunc, SurveyPageFunc) {
    "use strict";
    $(function () {
        var $header = $("#header");
        var $courseName = $("#course-name");
        var $taskSections = $("#task-sections");
        var $content = $("#content");
        var stateMachine = new StateFlow();
        var pageManager = new PageManager($content);
        var secManager = new TaskSectionManager($taskSections);
        $courseName.text("ENGG1200");
        var sectionDefinitions = [
            ["welcome", "Welcome"],
            ["initial-answer", "Initial Answer", Utils.DateTime.secToMs(15 * 60)],
            ["discussion", "Discussion", Utils.DateTime.secToMs(15 * 60)],
            ["revised-answer", "Revised Answer", Utils.DateTime.secToMs(6 * 60)],
            ["survey", "Survey"]
        ];
        secManager.registerAll(sectionDefinitions);
        var welcomePage = WelcomePageFunc(stateMachine, pageManager, secManager);
        var initialAnswerPage = InitialAnswerPageFunc(stateMachine, pageManager, secManager);
        var awaitGroupFormationPage = AwaitGroupFormationPageFunc(stateMachine, pageManager, secManager);
        var discussionPage = DiscussionPageFunc(stateMachine, pageManager, secManager);
        var revisedAnswerPage = RevisedAnswerPageFunc(stateMachine, pageManager, secManager);
        var surveyPage = SurveyPageFunc(stateMachine, pageManager, secManager);
        stateMachine.registerAll([
            {
                state: STATE.WELCOME,
                onEnter: welcomePage.onEnter,
                onLeave: welcomePage.onLeave
            },
            {
                state: STATE.INITIAL_ANSWER,
                onEnter: initialAnswerPage.onEnter,
                onLeave: initialAnswerPage.onLeave
            },
            {
                state: STATE.AWAIT_GROUP_FORMATION,
                onEnter: awaitGroupFormationPage.onEnter,
                onLeave: awaitGroupFormationPage.onLeave
            },
            {
                state: STATE.DISCUSSION,
                onEnter: discussionPage.onEnter,
                onLeave: discussionPage.onLeave
            },
            {
                state: STATE.REVISED_ANSWER,
                onEnter: revisedAnswerPage.onEnter,
                onLeave: revisedAnswerPage.onLeave
            },
            {
                state: STATE.SURVEY,
                onEnter: surveyPage.onEnter,
                onLeave: surveyPage.onLeave
            },
            {
                state: STATE.CONFIRMATION
            }
        ]);
        stateMachine.goTo(STATE.WELCOME);
    });
});
//# sourceMappingURL=main.js.map