define(["require", "exports", "jquery", "./Utils", "./StateFlow", "./PageManager", "./TaskSectionManager", "./MoocchatStates", "./pages/welcome", "./pages/initial-answer", "./pages/await-group-formation", "./pages/discussion", "./pages/revised-answer", "./pages/survey"], function (require, exports, $, Utils_1, StateFlow_1, PageManager_1, TaskSectionManager_1, MoocchatStates_1, welcome_1, initial_answer_1, await_group_formation_1, discussion_1, revised_answer_1, survey_1) {
    "use strict";
    $(function () {
        var $header = $("#header");
        var $courseName = $("#course-name");
        var $taskSections = $("#task-sections");
        var $content = $("#content");
        var stateMachine = new StateFlow_1.StateFlow();
        var pageManager = new PageManager_1.PageManager($content);
        var secManager = new TaskSectionManager_1.TaskSectionManager($taskSections);
        $courseName.text("ENGG1200");
        var sectionDefinitions = [
            ["welcome", "Welcome"],
            ["initial-answer", "Initial Answer", Utils_1.Utils.DateTime.secToMs(15 * 60)],
            ["discussion", "Discussion", Utils_1.Utils.DateTime.secToMs(15 * 60)],
            ["revised-answer", "Revised Answer", Utils_1.Utils.DateTime.secToMs(6 * 60)],
            ["survey", "Survey"]
        ];
        secManager.registerAll(sectionDefinitions);
        var welcomePage = welcome_1.WelcomePageFunc(stateMachine, pageManager, secManager);
        var initialAnswerPage = initial_answer_1.InitialAnswerPageFunc(stateMachine, pageManager, secManager);
        var awaitGroupFormationPage = await_group_formation_1.AwaitGroupFormationPageFunc(stateMachine, pageManager, secManager);
        var discussionPage = discussion_1.DiscussionPageFunc(stateMachine, pageManager, secManager);
        var revisedAnswerPage = revised_answer_1.RevisedAnswerPageFunc(stateMachine, pageManager, secManager);
        var surveyPage = survey_1.SurveyPageFunc(stateMachine, pageManager, secManager);
        stateMachine.registerAll([
            {
                state: MoocchatStates_1.MoocchatState.WELCOME,
                onEnter: welcomePage.onEnter,
                onLeave: welcomePage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.INITIAL_ANSWER,
                onEnter: initialAnswerPage.onEnter,
                onLeave: initialAnswerPage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.AWAIT_GROUP_FORMATION,
                onEnter: awaitGroupFormationPage.onEnter,
                onLeave: awaitGroupFormationPage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.DISCUSSION,
                onEnter: discussionPage.onEnter,
                onLeave: discussionPage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.REVISED_ANSWER,
                onEnter: revisedAnswerPage.onEnter,
                onLeave: revisedAnswerPage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.SURVEY,
                onEnter: surveyPage.onEnter,
                onLeave: surveyPage.onLeave
            },
            {
                state: MoocchatStates_1.MoocchatState.CONFIRMATION
            }
        ]);
        stateMachine.goTo(MoocchatStates_1.MoocchatState.WELCOME);
    });
});
//# sourceMappingURL=main.js.map