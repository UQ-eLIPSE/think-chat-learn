define(["require", "exports", "./Utils", "./TaskSection"], function (require, exports, Utils, TaskSection) {
    "use strict";
    var TaskSectionManager = (function () {
        function TaskSectionManager($taskSectionRootElem) {
            this.sections = {};
            this.$taskSectionRootElem = $taskSectionRootElem;
        }
        TaskSectionManager.prototype.registerAll = function (sectionDefinitions) {
            var _this = this;
            sectionDefinitions.forEach(function (section) {
                var newSection = Utils.Object.applyConstructor(TaskSection, section);
                _this.$taskSectionRootElem.append(newSection.elem);
                _this.sections[newSection.identifier] = newSection;
            });
        };
        TaskSectionManager.prototype.getSection = function (id) {
            return this.sections[id];
        };
        return TaskSectionManager;
    }());
    return TaskSectionManager;
});
//# sourceMappingURL=TaskSectionManager.js.map