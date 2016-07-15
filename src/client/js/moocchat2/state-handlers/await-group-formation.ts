import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";
import {MoocchatChat} from "../classes/MoocchatChat";

export const AwaitGroupFormationStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("await-group-formation");

        return {
            onEnter: () => {
                let waitStartTime = new Date().getTime();

                session.pageManager.loadPage("await-group-formation", (page$) => {
                    section.setActive();

                    MoocchatChat.emitJoinRequest(session, (data) => {
                        let playTone = page$("#play-group-formation-tone").is(":checked");
                        session.storage.setItem("play-notification-tone", playTone ? "true" : "false");

                        // Grouping events
                        let waitEndTime = new Date().getTime();
                        let waitTimeInSec = Math.floor((waitEndTime - waitStartTime) / 1000);
                        session.analytics.trackEvent("GROUP", data.groupId, "SIZE", data.groupSize);
                        session.analytics.trackEvent("GROUP", data.groupId, "WAIT_TIME_SECONDS", waitTimeInSec);

                        // Pass chat group formation data along to the DISCUSSION state
                        session.stateMachine.goTo(STATE.DISCUSSION, data);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
