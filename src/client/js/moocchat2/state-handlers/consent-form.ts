import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const ConsentFormStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.pageManager.loadPage("consent-form", (page$) => {
                    page$("#participant-info-sheet").on("click", () => {
                        window.open("/pdf/ENGG1200%20MOOCchat%20Participant%20Information%20Sheet.pdf");
                    });

                    // Fill in the name
                    page$("#name").text(_LTI_BASIC_LAUNCH_DATA.lis_person_name_full);

                    // NOTE:    Both decline and accept are in regards to participation in the research study only.
                    //          ** MOOCchat will launch either way. **

                    const $consentForm = page$("#consent-form");

                    $consentForm.on("submit", (e) => {
                        e.preventDefault();
                        
                        const $checkedOption = $(":checked", $consentForm);

                        if ($checkedOption.length === 0) {
                            alert("You must select an option on the consent form.");
                            return;
                        }

                        // Consent is given if "true" radio selected
                        session.setConsent($checkedOption.val() === "true");
                        session.stateMachine.goTo(STATE.SET_RESEARCH_CONSENT);
                    });
                });
            }
        }
    }
