import { IStateHandler, MoocchatState as STATE } from "../MoocchatStates";
import { MoocchatChat } from "../MoocchatChat";

import { OTLock } from "../../../common/js/OTLock";
import { Conf as CommonConf } from "../../../common/config/Conf";
import { Utils } from "../../../common/js/Utils";

export const AwaitGroupFormationStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("await-group-formation");

        let waitTimeProgressBarActive: boolean = true;

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

                    // Set up wait time progress bar
                    const $progressBar = page$("#group-formation-loader .progress");

                    // The expected maximum wait time is whatever the actual time is plus a minute for any potential backup client join requests
                    const expectedMaxTime = CommonConf.timings.chatGroupFormationTimeoutMs + Utils.DateTime.minToMs(1);
                    const startTime = Date.now();

                    const updateProgressBar = () => {
                        const currentTime = Date.now();

                        // Update width per frame
                        const progressPercent = ((currentTime - startTime) / expectedMaxTime) * 100;
                        $progressBar.width(progressPercent + "%");

                        // Stop when we hit 100%
                        if (progressPercent >= 100) {
                            return;
                        }

                        if (waitTimeProgressBarActive) {
                            requestAnimationFrame(updateProgressBar);
                        }
                    };

                    // Start
                    requestAnimationFrame(updateProgressBar);
                });
            },
            onLeave: () => {
                section.unsetActive();

                // Stop progress bar callback loop
                waitTimeProgressBarActive = false;
            }
        }
    }
