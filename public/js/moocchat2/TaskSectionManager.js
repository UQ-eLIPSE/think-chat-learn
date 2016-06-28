define(["require", "exports", "./TaskSection"], function (require, exports, TaskSection_1) {
    "use strict";
    var TaskSectionManager = (function () {
        function TaskSectionManager($taskSectionRootElem) {
            this.sections = {};
            this.$taskSectionRootElem = $taskSectionRootElem;
        }
        TaskSectionManager.prototype.register = function (id, text, ms) {
            var newSection = new TaskSection_1.TaskSection(id, text, ms);
            this.$taskSectionRootElem.append(newSection.elem);
            this.sections[newSection.identifier] = newSection;
        };
        TaskSectionManager.prototype.registerAll = function (sectionDefinitions) {
            var _this = this;
            sectionDefinitions.forEach(function (section) {
                _this.register.apply(_this, section);
            });
        };
        TaskSectionManager.prototype.getSection = function (id) {
            return this.sections[id];
        };
        return TaskSectionManager;
    }());
    exports.TaskSectionManager = TaskSectionManager;
});
