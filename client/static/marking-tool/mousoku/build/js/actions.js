define(["require", "exports", "jquery", "./classes/MoocchatBridge"], function (require, exports, $, MoocchatBridge_1) {
    "use strict";
    var bridge = MoocchatBridge_1.MoocchatBridge.GetBridge();
    $(function () {
        var quizScheduleString = sessionStorage.getItem("quizSchedule");
        if (!quizScheduleString) {
            return alert("Quiz schedule missing");
        }
        var quizSchedule = JSON.parse(quizScheduleString);
        var questionString = sessionStorage.getItem("question");
        if (!questionString) {
            return alert("Question missing");
        }
        var question = JSON.parse(questionString);
        var $quizScheduleName = $("#quiz-schedule-name");
        $quizScheduleName.text(question.title + " (" + quizSchedule.availableStart + " to " + quizSchedule.availableEnd + ")");
    });
});
