define(["require", "exports"], function (require, exports) {
    "use strict";
    var MoocchatQuiz = (function () {
        function MoocchatQuiz(data) {
            this.data = data;
        }
        Object.defineProperty(MoocchatQuiz.prototype, "questionNumber", {
            get: function () {
                return this.data.questionNumber;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatQuiz.prototype, "questionReading", {
            get: function () {
                return this.data.reading;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatQuiz.prototype, "questionStatement", {
            get: function () {
                return this.data.probingQuestion;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatQuiz.prototype, "questionChoices", {
            get: function () {
                return this.data.probingQuestionChoices;
            },
            enumerable: true,
            configurable: true
        });
        return MoocchatQuiz;
    }());
    exports.MoocchatQuiz = MoocchatQuiz;
});
