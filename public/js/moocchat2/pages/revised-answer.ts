import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let RevisedAnswerPageFunc: IPageFunc<STATE> =
    (stateMachine, pageManager, secManager) => {
        let section = secManager.getSection("revised-answer");

        return {
            onEnter: () => {
                pageManager.loadPage("revised-answer", (page$) => {
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
