import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const InvalidLoginStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: (data) => {
                session.pageManager.loadPage("invalid-login", (page$) => {
                    const $reason = page$("#reason");

                    $reason.text(data.reason);



                    let errReasonCode = data.reason.split(" ")[0];
                    if (errReasonCode) {
                        errReasonCode = parseInt(errReasonCode.replace(/[\[\]']+/g, ''), 10);

                        switch (errReasonCode) {
                            // Session active somewhere else
                            case 20:
                                page$("#try-again").hide();
                                page$("#extra-reason-content").append([
                                    $("<p>").text("You can terminate other sessions by clicking on the button below. You will be returned to Blackboard afterwards, where you can reattempt to log in to MOOCchat again."),
                                    $("<button>").text("Terminate all my sessions").on("click", () => {

                                        // TODO: The lack of checks for this is bad, as anyone can kill anyone else's sessions.
                                        session.socket.once("terminateSessionsComplete", () => {
                                            window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                                        });

                                        session.socket.emitData("terminateSessions", {
                                            username: _LTI_BASIC_LAUNCH_DATA.user_id
                                        });
                                    })
                                ]);
                                break;

                            // No scheduled quizzes right now
                            case 30:
                                session.socket.close();
                                page$("#try-again").hide();
                                page$("#extra-reason-content").append([
                                    $("<p>").text("MOOCchat could not find a quiz scheduled at the present time. Try again later during a scheduled time period."),
                                    $("<button>").text("Return to Blackboard").on("click", () => {
                                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                                    })
                                ]);
                                break;

                            // LTI timestamp stale
                            case 41:
                                session.socket.close();
                                page$("#try-again").hide();
                                page$("#extra-reason-content").append([
                                    $("<p>").text("You appear to have taken too long to log into MOOCchat. Return to Blackboard and log in again."),
                                    $("<button>").text("Return to Blackboard").on("click", () => {
                                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                                    })
                                ]);
                                break;

                            // LTI nonce replay
                            case 42:
                                session.socket.close();
                                page$("#try-again").hide();
                                page$("#extra-reason-content").append([
                                    $("<p>").text("You appear to have replayed a previous log in attempt. Return to Blackboard and log in again."),
                                    $("<button>").text("Return to Blackboard").on("click", () => {
                                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                                    })
                                ]);
                                break;
                        }
                    }



                });
            }
        }
    }
