define(["require", "exports", "./Utils", "./TaskSection"], function (require, exports, Utils_1, TaskSection_1) {
    "use strict";
    var TaskSectionManager = (function () {
        function TaskSectionManager($taskSectionRootElem) {
            this.sections = {};
            this.$taskSectionRootElem = $taskSectionRootElem;
        }
        TaskSectionManager.prototype.registerAll = function (sectionDefinitions) {
            var _this = this;
            sectionDefinitions.forEach(function (section) {
                var newSection = Utils_1.Utils.Object.applyConstructor(TaskSection_1.TaskSection, section);
                _this.$taskSectionRootElem.append(newSection.elem);
                _this.sections[newSection.identifier] = newSection;
            });
        };
        TaskSectionManager.prototype.getSection = function (id) {
            return this.sections[id];
        };
        return TaskSectionManager;
    }());
    exports.TaskSectionManager = TaskSectionManager;
});
//# sourceMappingURL=TaskSectionManager.js.map