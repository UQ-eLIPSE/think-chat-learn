import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";
import {MoocchatChat} from "../MoocchatChat";

import {OTLock} from "../../../common/js/OTLock";

export const AwaitGroupFormationStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("await-group-formation");
        
        let tooLongTimeoutHandle: number;

        const chatJoinOneTimeLock = new OTLock();

        return {
            onEnter: () => {
                // Check if lock is already set
                if (chatJoinOneTimeLock.locked) {
                    throw new Error("Group formation one time condition violated");
                }

                // Only one chat join per session
                chatJoinOneTimeLock.lock();

                const waitStartTime = new Date().getTime();

                session.pageManager.loadPage("await-group-formation", (page$) => {
                    section.setActive();

                    MoocchatChat.EmitJoinRequest(session, (data) => {
                        const playTone = page$("#play-group-formation-tone").is(":checked");
                        session.storage.setItem("play-notification-tone", playTone ? "true" : "false");

                        // Grouping events
                        const waitEndTime = new Date().getTime();
                        const waitTimeInSec = Math.floor((waitEndTime - waitStartTime) / 1000);
                        session.analytics.trackEvent("GROUP", data.groupId, "SIZE", data.groupSize);
                        session.analytics.trackEvent("GROUP", data.groupId, "WAIT_TIME_SECONDS", waitTimeInSec);

                        // Pass chat group formation data along to the DISCUSSION state
                        session.stateMachine.goTo(STATE.DISCUSSION, data);
                    });

                    // // If too long, force reconnect to see if we just missed something
                    // tooLongTimeoutHandle = setTimeout(() => {
                    //     session.socket.restart();

                    //     // If that fails then alert
                    //     tooLongTimeoutHandle = setTimeout(() => {
                    //         alert(`We can't seem to get you into a chat session. Please restart MOOCchat.`);
                    //     }, 1 * 60 * 1000);

                    // }, 2.5 * 60 * 1000);
                });
            },
            onLeave: () => {
                section.unsetActive();
                clearTimeout(tooLongTimeoutHandle);
            }
        }
    }
