import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("welcome");

    return {
        onEnter: () => {
            pageManager.loadPage("welcome", (page$) => {
                section.setActive();
                page$("button").on("click", () => {
                    stateMachine.goTo(STATE.INITIAL_ANSWER);
                });

                page$("a").on("click", () => {
                    stateMachine.goTo(STATE.DISCUSSION);
                })
            });
        },
        onLeave: () => {
            section.setInactive();
        }
    }
}