define(["require", "exports", "jquery", "FileSaver", "./classes/MoocchatBridge"], function (require, exports, $, saveAs, MoocchatBridge_1) {
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
        var $performExport = $("#perform-export");
        $performExport.on("click", function () {
            var quizId = quizSchedule._id;
            bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/quizAttempt_user", undefined, function (response) {
                var quizAttempt_users = response.payload;
                bridge.sendXhrRequest("GET", "/api/admin/quiz/" + quizId + "/mark", undefined, function (response) {
                    var marks = response.payload;
                    var markLookup = {};
                    marks.forEach(function (mark) { return markLookup[mark.quizAttemptId] = mark.value; });
                    var csvArray = [];
                    csvArray.push("username,mark,quizAttemptId");
                    quizAttempt_users.forEach(function (quizAttempt_user) {
                        var username = quizAttempt_user._user.username;
                        var quizAttemptId = quizAttempt_user._id;
                        var markValue = markLookup[quizAttemptId];
                        var mark = (markValue === undefined ? "" : markValue).toString();
                        csvArray.push(username + "," + mark + "," + quizAttemptId);
                    });
                    var csvBlob = new Blob([csvArray.join("\n")], { type: "text/csv" });
                    saveAs(csvBlob, "mousoku__quiz_" + quizId + ".csv");
                });
            });
        });
    });
});
