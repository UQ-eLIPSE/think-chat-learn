import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("survey");

    return {
        onEnter: () => {
            pageManager.loadPage("survey", (page$) => {
                section.setActive();
            });
        },
        onLeave: () => {
            section.setInactive();
        }
    }
}