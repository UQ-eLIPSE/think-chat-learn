import {IStateHandler} from "../classes/IStateHandler";
import {VirtServerComms} from "../classes/VirtServerComms";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const CompletionStateHandler: IStateHandler<STATE> =
    (session, beforeUnloadHandler) => {
        const section = session.sectionManager.getSection("finish");

        return {
            onEnter: () => {
                session.analytics.trackEvent("MOOCCHAT", "FINISH");

                const loadFunc = (virtServerData?: string) => {
                    window.removeEventListener("beforeunload", beforeUnloadHandler);

                    session.pageManager.loadPage("completion", (page$) => {
                        section.setActive();

                        // Session ID is split every 4th character to make it easier to read
                        page$("#session-id").text(session.id.match(/.{1,4}/g).join(" "));
                        page$("#time-now").text(new Date().toISOString());

                        page$("#print-receipt").on("click", () => {
                            window.print();
                        });

                        page$("#go-to-return-url").on("click", () => {
                            window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                        });

                        const initialAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.initial.optionId)[0];
                        const revisedAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.revised.optionId)[0];

                        page$("#initial-answer-content").html(initialAnswer.content);
                        page$("#initial-answer-justification").text(session.answers.initial.justification);

                        page$("#revised-answer-content").html(revisedAnswer.content);
                        page$("#revised-answer-justification").text(session.answers.revised.justification);

                        if (virtServerData) {
                            const $virtServerBackupFail = page$("#virtserver-backup-fail");
                            $virtServerBackupFail.removeClass("hidden");
                            $("p", $virtServerBackupFail).text(virtServerData);
                            alert(`Server synchronisation failed. Please copy the contents of the page and send this to your course representative.`);
                        }

                    });

                    // Log out now
                    session.logout(() => {
                        setTimeout(() => {
                            session.socket.close();
                        }, 500);
                    });
                }

                if (session.socket instanceof VirtServerComms) {
                    const syncXHR = (<VirtServerComms>session.socket).syncWithRealServer(session.id);

                    if (syncXHR) {
                        syncXHR.xhr
                            .done(() => {
                                loadFunc();
                            })
                            .fail(() => {
                                loadFunc(syncXHR.data);
                            });
                    } else {
                        loadFunc();
                    }
                } else {
                    loadFunc();
                }
            }
        }
    }
