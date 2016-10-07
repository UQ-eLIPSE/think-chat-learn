// import { Conf as CommonConf } from "../common/config/Conf";

import * as $ from "jquery";

import { StateMachine } from "../common/js/StateMachine";
import { StateMachineDescription } from "../common/js/StateMachineDescription";

import {ILTIData} from "../common/interfaces/ILTIData";


declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;





enum STATE {
    BOOTSTRAP,

    STARTUP,

    LOGIN,


}



const fsmDesc = new StateMachineDescription(STATE.BOOTSTRAP, [
    {
        label: "startup",
        fromState: STATE.BOOTSTRAP,
        toState: STATE.STARTUP,
        onAfterTransition: () => {
            $(() => {
                let courseName: string;

                // Get course name from context_label first, then try using value in square brackets in title
                courseName = _LTI_BASIC_LAUNCH_DATA.context_label.split("_")[0];

                if (courseName.length <= 4) {
                    // http://stackoverflow.com/a/11013275
                    let stringsInSquareBrackets = _LTI_BASIC_LAUNCH_DATA.context_title.match(/[^[\]]+(?=])/g);

                    if (stringsInSquareBrackets) {
                        courseName = stringsInSquareBrackets[0];
                    } else {
                        courseName = "";
                    }
                }

                $("#course-name").text(`${courseName} Admin`);

                fsm.executeTransition("login");
            });
        },
    },
    {
        label: "login",
        fromState: "*",
        toState: STATE.LOGIN,
    },
]);

fsmDesc.addStateChangeHandlers(STATE.LOGIN, {
    onEnter: () => {
        alert("Welcome to MOOCchat");
    }
});

const fsm = new StateMachine(fsmDesc);
fsm.executeTransition("startup");




// On DOM Ready
$(() => {
});