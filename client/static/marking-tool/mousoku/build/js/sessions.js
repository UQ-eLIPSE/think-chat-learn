define(["require", "exports", "jquery", "./classes/MoocchatBridge"], function (require, exports, $, MoocchatBridge_1) {
    "use strict";
    var bridge = MoocchatBridge_1.MoocchatBridge.GetBridge();
    $(function () {
        var $sessionsList = $("#sessions-list");
        $sessionsList.on("click", "li.session-item a", function (e) {
            var $elem = $(e.currentTarget);
            var quizSchedule = $elem.data("quizSchedule");
            var question = $elem.data("question");
            sessionStorage.setItem("quizSchedule", JSON.stringify(quizSchedule));
            sessionStorage.setItem("question", JSON.stringify(question));
            location.assign("./actions.html");
        });
        bridge.sendXhrRequest("GET", "/api/admin/quiz", undefined, function (response) {
            var quizSchedules = response.payload;
            bridge.sendXhrRequest("GET", "/api/admin/question", undefined, function (response) {
                var questions = response.payload;
                quizSchedules.forEach(function (quizSchedule) {
                    var question = questions.filter(function (_) { return _._id === quizSchedule.questionId; })[0] || {};
                    var title = question.title;
                    var $sessionItem = $("<li>")
                        .addClass("session-item")
                        .append($("<a>")
                        .attr("href", "#_" + quizSchedule._id)
                        .data("quizSchedule", quizSchedule)
                        .data("question", question)
                        .text(title + " (" + quizSchedule.availableStart + " to " + quizSchedule.availableEnd + ")"))
                        .appendTo($sessionsList);
                });
            });
        });
    });
});
