import {Conf as CommonConf} from "../common/config/Conf";

import * as $ from "jquery";

import {WebsocketManager} from "./js/WebsocketManager";
import {WebsocketEvents} from "./js/WebsocketEvents";
import * as IWSToServerData from "../common/interfaces/IWSToServerData";

import {MoocchatSession} from "./js/MoocchatSession";

import {MoocchatState as STATE} from "./js/MoocchatStates";


import {StartupStateHandler} from "./js/state-handlers/startup";
import {LoginStateHandler} from "./js/state-handlers/login";
import {SetResearchConsentStateHandler} from "./js/state-handlers/set-research-consent";
import {WelcomeStateHandler} from "./js/state-handlers/welcome";
import {BackupClientAnswerStateHandler} from "./js/state-handlers/backup-client-answer";
import {BackupClientWaitStateHandler} from "./js/state-handlers/backup-client-wait";
import {DiscussionStateHandler} from "./js/state-handlers/discussion";
import {BackupClientReturnToWaitStateHandler} from "./js/state-handlers/backup-client-return-to-wait";
import {BackupClientLogoutStateHandler} from "./js/state-handlers/backup-client-logout";
import {BackupClientEjectedStateHandler} from "./js/state-handlers/backup-client-ejected";

import {NoLtiDataStateHandler} from "./js/state-handlers/no-lti-data";
import {InvalidLoginStateHandler} from "./js/state-handlers/invalid-login";


/*
 * MOOCchat
 * Backup-client module
 * 
 * Main JS module for backup clients (e.g. tutor/instructors in backup queue)
 */


// Start Websockets as soon as possible
const websocket = new WebsocketManager();
websocket.open();


// On DOM Ready
$(() => {
    // const $header = $("#header");
    const $courseName = $("#course-name");
    const $taskSections = $("#task-sections");
    const $content = $("#content");
    const $blackboardOpen = $("#blackboard-open");

    const $reconnectMessage = $("#reconnect-message");
    const $sendAttemptMessage = $("#send-attempt-message");

    const session = new MoocchatSession<STATE>($content, $taskSections, false).setSocket(websocket);

    window.addEventListener("unload", () => {
        session.logout();
    });

    // Resend sync when [re]connected when we have a session going
    websocket.on("connect", () => {
        $reconnectMessage.addClass("hidden");

        if (session.id) {
            websocket.emitData<IWSToServerData.SessionSocketResync>(WebsocketEvents.OUTBOUND.SESSION_SOCKET_RESYNC, {
                sessionId: session.id
            });
        }
    });

    websocket.on("reconnecting", () => {
        $reconnectMessage.removeClass("hidden");
    });


    // Show data retransmissions
    let lastSeqNumber: number = -1;

    session.eventManager.on("PacSeq::InternalEvent::EmitStart", (data: any) => {
        lastSeqNumber = data.seq;

        if (data.attempt > 1) {
            $sendAttemptMessage.removeClass("hidden");
            $("span", $sendAttemptMessage).text(data.attempt);
        } else {
            $sendAttemptMessage.addClass("hidden");
        }
    });

    session.eventManager.on("PacSeq::InternalEvent::AckReceived", (data: any) => {
        if (data.seq >= lastSeqNumber) {
            $sendAttemptMessage.addClass("hidden");
        }
    });


    // Sections must be defined now before other resources use them
    session.sectionManager.registerAll([
        // [id, name, milliseconds]
        ["welcome", "Welcome"],
        ["backup-client-answer", "Provide Answer"],
        ["backup-client-wait", "Wait To Be Called"],
        ["discussion", "Discussion", CommonConf.timings.discussionMs],
        ["backup-client-logout", "Log Out"]
    ]);

    // Individual state handlers
    const startupState = StartupStateHandler(session, STATE.LOGIN, $courseName, $blackboardOpen, true);
    const loginState = LoginStateHandler(session, STATE.SET_RESEARCH_CONSENT, STATE.SET_RESEARCH_CONSENT);
    const setResearchConsentState = SetResearchConsentStateHandler(session);
    const welcomeState = WelcomeStateHandler(session, STATE.BACKUP_CLIENT_ANSWER);
    const backupClientAnswerState = BackupClientAnswerStateHandler(session);
    const backupClientWaitState = BackupClientWaitStateHandler(session);
    const discussionState = DiscussionStateHandler(session, STATE.BACKUP_CLIENT_RETURN_TO_WAIT);
    const backupClientReturnToWaitState = BackupClientReturnToWaitStateHandler(session);
    const backupClientLogoutState = BackupClientLogoutStateHandler(session);
    const backupClientEjectedState = BackupClientEjectedStateHandler(session);

    const noLtiDataState = NoLtiDataStateHandler(session, $courseName);
    const invalidLoginState = InvalidLoginStateHandler(session);

    session.stateMachine.registerAll([
        {   // Startup
            state: STATE.STARTUP,
            onEnter: startupState.onEnter
        },
        {   // No LTI data
            state: STATE.NO_LTI_DATA,
            onEnter: noLtiDataState.onEnter
        },
        {   // Login
            state: STATE.LOGIN,
            onEnter: loginState.onEnter
        },
        {   // Invalid login
            state: STATE.INVALID_LOGIN,
            onEnter: invalidLoginState.onEnter
        },
        {   // Set research consent
            state: STATE.SET_RESEARCH_CONSENT,
            onEnter: setResearchConsentState.onEnter
        },
        {   // Welcome
            state: STATE.WELCOME,
            onEnter: welcomeState.onEnter,
            onLeave: welcomeState.onLeave
        },
        {   // Instructor answer to question/Backup queue answer
            state: STATE.BACKUP_CLIENT_ANSWER,
            onEnter: backupClientAnswerState.onEnter,
            onLeave: backupClientAnswerState.onLeave
        },
        {   // Wait to be called/Backup client wait
            state: STATE.BACKUP_CLIENT_WAIT,
            onEnter: backupClientWaitState.onEnter,
            onLeave: backupClientWaitState.onLeave
        },
        {   // Discussion
            state: STATE.DISCUSSION,
            onEnter: discussionState.onEnter,
            onLeave: discussionState.onLeave
        },
        {   // Intermediate state between discussion and client wait to reenter queue
            state: STATE.BACKUP_CLIENT_RETURN_TO_WAIT,
            onEnter: backupClientReturnToWaitState.onEnter
        },
        {   // Ejected
            state: STATE.BACKUP_CLIENT_EJECTED,
            onEnter: backupClientEjectedState.onEnter
        },
        {   // Logout
            state: STATE.BACKUP_CLIENT_LOGOUT,
            onEnter: backupClientLogoutState.onEnter
        }
    ]);

    // Backup client has implicit research consent TRUE.
    session.setConsent(true);

    // Start the state machine
    session.stateMachine.goTo(STATE.STARTUP);

});
