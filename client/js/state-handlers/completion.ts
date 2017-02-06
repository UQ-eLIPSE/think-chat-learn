import { Conf } from "../../config/Conf";

import { IStateHandler, MoocchatState as STATE } from "../MoocchatStates";

import { ILTIData } from "../../../common/interfaces/ILTIData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;

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

                        // Quiz attempt ID is split every 4th character to make it easier to read
                        page$("#quiz-attempt-id").text(session.quizAttemptId.match(/.{1,4}/g).join(" "));
                        page$("#time-now").text(new Date().toISOString());

                        page$("#print-receipt").on("click", () => {
                            window.print();
                        });

                        page$("#go-to-return-url").one("click", () => {
                            window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                        });

                        const initialAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.initial.optionId)[0];
                        const revisedAnswer = session.quiz.questionOptions.filter((option) => option._id === session.answers.revised.optionId)[0];

                        page$("#initial-answer-content").html(initialAnswer ? initialAnswer.content : "[NO OPTION SELECTED]");
                        page$("#initial-answer-justification").text(session.answers.initial.justification);

                        page$("#revised-answer-content").html(revisedAnswer ? revisedAnswer.content : "[NO OPTION SELECTED]");
                        page$("#revised-answer-justification").text(session.answers.revised.justification);
                    });

                    // Log out now
                    session.logout(() => {
                        setTimeout(() => {
                            // session.socket.close();
                        }, Conf.websockets.disconnectCooloffTimeoutMs);
                    });
                }

                loadFunc();
            }
        }
    }
