import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("revised-answer");

    return {
        onEnter: () => {
            pageManager.loadPage("revised-answer", (page$) => {
                section.setActive();
                section.startTimer();

                page$("button").on("click", () => {
                    stateMachine.goTo(STATE.SURVEY);
                });
            });
        },
        onLeave: () => {
            section.setInactive();
            section.hideTimer();
        }
    }
}