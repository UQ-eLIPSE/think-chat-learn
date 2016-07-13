import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";
import {IEventData_ChatGroupFormed} from "../classes/IEventData";

import {WebsocketEvents} from "../classes/Websockets";

export let AwaitGroupFormationPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("await-group-formation");

        return {
            onEnter: () => {
                let waitStartTime = new Date().getTime();

                session.pageManager.loadPage("await-group-formation", (page$) => {
                    section.setActive();

                    session.socket.once(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, (data: IEventData_ChatGroupFormed) => {
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

                    session.socket.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
                        sessionId: session.id
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
