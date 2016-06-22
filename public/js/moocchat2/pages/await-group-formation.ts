import StateFlow = require("../StateFlow");
import PageManager = require("../PageManager");
import TaskSectionManager = require("../TaskSectionManager");

import STATE = require("../MoocchatStates");

export = (stateMachine: StateFlow<STATE>, pageManager: PageManager, secManager: TaskSectionManager) => {
    let section = secManager.getSection("discussion");

    return {
        onEnter: () => {
            pageManager.loadPage("await-group-formation", (page$) => {
                section.setActive();
                section.setPaused();

                // TODO: Use incoming chat formation event to progress to next state
                let waitTime = (Math.random() * 30 * 1000) + (10 * 1000);

                setTimeout(() => {
                    let playTone = page$("#play-group-formation-tone").is(":checked");
                    sessionStorage.setItem("play-notification-tone", playTone ? "true" : "false");
                    stateMachine.goTo(STATE.DISCUSSION);
                }, waitTime);
            });
        },
        onLeave: () => {

        }
    }
}