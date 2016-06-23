define(["require", "exports"], function (require, exports) {
    "use strict";
    (function (MoocchatState) {
        MoocchatState[MoocchatState["WELCOME"] = 0] = "WELCOME";
        MoocchatState[MoocchatState["INITIAL_ANSWER"] = 1] = "INITIAL_ANSWER";
        MoocchatState[MoocchatState["AWAIT_GROUP_FORMATION"] = 2] = "AWAIT_GROUP_FORMATION";
        MoocchatState[MoocchatState["DISCUSSION"] = 3] = "DISCUSSION";
        MoocchatState[MoocchatState["REVISED_ANSWER"] = 4] = "REVISED_ANSWER";
        MoocchatState[MoocchatState["SURVEY"] = 5] = "SURVEY";
        MoocchatState[MoocchatState["CONFIRMATION"] = 6] = "CONFIRMATION";
    })(exports.MoocchatState || (exports.MoocchatState = {}));
    var MoocchatState = exports.MoocchatState;
});
//# sourceMappingURL=MoocchatStates.js.map