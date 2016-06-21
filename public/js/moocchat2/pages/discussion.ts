import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("discussion");

    return {
        onEnter: () => {
            pageManager.loadPage("discussion", (page$) => {
                section.setActive();
                section.startTimer();

                page$("button").on("click", () => {
                    stateMachine.goTo(STATE.REVISED_ANSWER);
                });
            });
        },
        onLeave: () => {
            section.setInactive();
            section.hideTimer();
        }
    }
}