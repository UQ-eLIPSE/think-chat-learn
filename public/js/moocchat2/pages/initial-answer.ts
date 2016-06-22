import $ = require("jquery");
import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("initial-answer");

    return {
        onEnter: () => {
            pageManager.loadPage("initial-answer", (page$) => {
                section.setActive();
                section.startTimer();

                page$("button").on("click", () => {
                    stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
                });


                let $answers = page$("#answers");

                $answers.on("click", "li", function(e) {
                    e.preventDefault();

                    $("li", $answers).removeClass("selected");

                    $(this).addClass("selected");
                });
            });
        },
        onLeave: () => {
            section.setInactive();
            section.hideTimer();
        }
    }
}