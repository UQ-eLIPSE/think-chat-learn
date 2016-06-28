import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";
import {IEventData_ChatGroupFormed} from "../IEventData";

import {WebsocketEvents} from "../Websockets";

export let AwaitGroupFormationPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("discussion");

        return {
            onEnter: () => {
                session.pageManager.loadPage("await-group-formation", (page$) => {
                    section.setActive();
                    section.setPaused();

                    session.socket.once(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, (data: IEventData_ChatGroupFormed) => {
                        let playTone = page$("#play-group-formation-tone").is(":checked");
                        sessionStorage.setItem("play-notification-tone", playTone ? "true" : "false");

                        // Pass chat group formation data along to the DISCUSSION state
                        session.stateMachine.goTo(STATE.DISCUSSION, data);
                    });

                    session.socket.emit(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
                        username: session.user.username
                    });
                });
            }
        }
    }
