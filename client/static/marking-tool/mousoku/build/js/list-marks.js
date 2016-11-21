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
        var quizId = quizSchedule._id;
        var $markListTableBody = $("#mark-list-table-body");
        bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/quizAttempt_user", undefined, function (response) {
            var quizAttempt_users = response.payload;
            bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/mark", undefined, function (response) {
                var marks = response.payload;
                var markLookup = {};
                marks.forEach(function (mark) { return markLookup[mark.quizAttemptId] = mark.value; });
                var rows = [];
                quizAttempt_users.forEach(function (quizAttempt_user) {
                    var username = quizAttempt_user._user.username;
                    var quizAttemptId = quizAttempt_user._id;
                    var mark = (markLookup[quizAttemptId] || "").toString();
                    rows.push($("<tr>").append([
                        $("<td>").append([
                            $("<a>").addClass("open-attempt").attr("href", "#").data("quizAttemptId", quizAttemptId).text(quizAttemptId),
                        ]),
                        $("<td>").text(username),
                        $("<td>").text(mark),
                    ]));
                });
                $markListTableBody
                    .append(rows)
                    .on("click", "a.open-attempt", function (e) {
                    e.preventDefault();
                    var $elem = $(e.currentTarget);
                    var quizAttemptId = $elem.data("quizAttemptId");
                    location.assign("./marking.html#" + quizAttemptId);
                });
            });
        });
    });
});
