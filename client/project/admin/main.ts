import { Conf } from "../../config/Conf";
// import { Conf as CommonConf } from "../common/config/Conf";

import * as $ from "jquery";

import { StateMachine } from "../../../common/js/StateMachine";
import { StateMachineDescription } from "../../../common/js/StateMachineDescription";

import { EventBox } from "../../../common/js/EventBox";

import * as IMoocchatApi from "../../../common/interfaces/IMoocchatApi";
import { ILTIData } from "../../../common/interfaces/ILTIData";

import { CombinedPageManager } from "../../js/CombinedPageManager";

import { AuthDataWrapperLTI } from "../../js/auth/AuthDataWrapperLTI";

// LTI data should be inserted on the page during LTI handover
declare const _LTI_BASIC_LAUNCH_DATA: ILTIData | undefined;


enum STATE {
    ZERO,

    ERROR,

    STARTUP,
    LOGIN,
    LOGOUT,

    MAIN_PAGE,

    QUIZ_SCHEDULES_PAGE,
    QUIZ_SCHEDULE_DETAILS_PAGE,
    QUIZ_SCHEDULE_CREATION_PAGE,

    QUESTIONS_PAGE,
    QUESTION_DETAILS_PAGE,
    QUESTION_CREATION_PAGE,


}


let sessionId: string | undefined;
let lti: AuthDataWrapperLTI;

function setSectionActive(section?: string) {
    $("#task-sections li.active").removeClass("active");
    if (section) {
        $(`#task-sections li[data-section="${section}"]`).addClass("active");
    }
}

$(() => {
    const $content = $("#content");
    const eventBox = new EventBox();
    const pageManager = new CombinedPageManager(eventBox, $content, Conf.combinedHTML.url);

    const fsmDesc: StateMachineDescription = new StateMachineDescription(STATE.ZERO, [
        {
            label: "startup",
            fromState: STATE.ZERO,
            toState: STATE.STARTUP,
            onAfterTransition: () => {
                // If there isn't LTI data, we need to move to an error page
                if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined" || !_LTI_BASIC_LAUNCH_DATA) {
                    return fsm.executeTransition("error", `No LTI data`);
                }

                lti = new AuthDataWrapperLTI(_LTI_BASIC_LAUNCH_DATA);

                $("#course-name").text(`${lti.getCourseName()} Admin`);

                // Set up the sidebar links 
                $("#log-out").on("click", () => {
                    fsm.executeTransition("logout");
                });

                $("#go-to-home").on("click", () => {
                    fsm.executeTransition("load-main");
                });

                $("#go-to-quizzes").on("click", () => {
                    fsm.executeTransition("load-quiz-schedules");
                });

                fsm.executeTransition("login");
            },
        },
        {
            label: "error",
            fromState: "*",
            toState: STATE.ERROR,
        },
        {
            label: "login",
            fromState: "*",
            toState: STATE.LOGIN,
        },
        {
            label: "logout",
            fromState: "*",
            toState: STATE.LOGOUT,
        },
        {
            label: "load-main",
            fromState: "*",
            toState: STATE.MAIN_PAGE,
        },
        {
            label: "load-quiz-schedules",
            fromState: "*",
            toState: STATE.QUIZ_SCHEDULES_PAGE,
        },
        {
            label: "load-quiz-schedule-details",
            fromState: "*",
            toState: STATE.QUIZ_SCHEDULE_DETAILS_PAGE,
        },
        {
            label: "load-quiz-schedule-creation",
            fromState: "*",
            toState: STATE.QUIZ_SCHEDULE_CREATION_PAGE,
        },
        {
            label: "load-questions",
            fromState: "*",
            toState: STATE.QUESTIONS_PAGE,
        },
        {
            label: "load-question-details",
            fromState: "*",
            toState: STATE.QUESTION_DETAILS_PAGE,
        },
        {
            label: "load-question-creation",
            fromState: "*",
            toState: STATE.QUESTION_CREATION_PAGE,
        },

    ]);

    fsmDesc.addStateChangeHandlers(STATE.ERROR, {
        onEnter: (_label, _oldState, _newState, ...args) => {
            pageManager.loadPage("error", (page$) => {
                setSectionActive();
                page$("#reason").text(args[0]);
            });

            fsm.halt();
        }
    });

    fsmDesc.addStateChangeHandlers(STATE.LOGIN, {
        onEnter: () => {
            // Wipe session ID
            sessionId = undefined;

            // Show log in interstitial
            pageManager.loadPage("logging-in");

            // Request login with session ID            
            $.ajax({
                method: "POST",
                url: "/api/client/session/lti",
                contentType: "application/json; charset=utf-8",
                data: lti.stringify(),
                dataType: "json",
            })
                .done((data: IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientLoginResponsePayload>) => {
                    // Must check success flag
                    if (!data.success) {
                        // Something went wrong - check message
                        return fsm.executeTransition("error", data.message);
                    }

                    sessionId = data.payload.sessionId;

                    fsm.executeTransition("load-main");
                })
                .fail((_jqXHR, textStatus, errorThrown) => {
                    // Something really wrong with request or server
                    console.error(textStatus);
                    console.error(errorThrown);
                });
        }
    });

    fsmDesc.addStateChangeHandlers(STATE.LOGOUT, {
        onEnter: () => {
            $.ajax({
                method: "DELETE",
                url: "/api/client/session",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                headers: {
                    "Moocchat-Session-Id": sessionId,
                }
            })
                .done((data: IMoocchatApi.ToClientResponseBase<void>) => {
                    // Must check success flag
                    if (!data.success) {
                        // Something went wrong - check message
                        return fsm.executeTransition("error", data.message);
                    }

                    // Wipe session
                    sessionId = undefined;

                    // Return to LTI return URL
                    window.location.assign(lti.getData().launch_presentation_return_url || "");

                    // Halt the FSM to prevent further actions
                    fsm.halt();
                })
                .fail((_jqXHR, textStatus, errorThrown) => {
                    // Something really wrong with request or server
                    console.error(textStatus);
                    console.error(errorThrown);
                });
        }
    });

    fsmDesc.addStateChangeHandlers(STATE.MAIN_PAGE, {
        onEnter: () => {
            pageManager.loadPage("admin-main", (page$) => {
                setSectionActive("main");

                page$("#name").text(lti.getData().lis_person_name_full || "[name unknown]");

                page$("#view-quiz-schedules").on("click", (e) => {
                    e.preventDefault();

                    fsm.executeTransition("load-quiz-schedules");
                });

                page$("#view-question-bank").on("click", (e) => {
                    e.preventDefault();

                    fsm.executeTransition("load-questions");
                });
            });
        }
    });

    {
        let loadQuizScheduleXhr: JQueryXHR | undefined;

        fsmDesc.addStateChangeHandlers(STATE.QUIZ_SCHEDULES_PAGE, {
            onEnter: () => {
                loadQuizScheduleXhr = $.ajax({
                    method: "GET",
                    url: "/api/client/quiz",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Moocchat-Session-Id": sessionId,
                    }
                });

                pageManager.loadPage("admin-quiz-schedules", (page$) => {
                    setSectionActive("quizzes");

                    page$("#create-quiz-schedule").on("click", (e) => {
                        e.preventDefault();
                        fsm.executeTransition("load-quiz-schedule-creation");
                    });

                    page$("#quiz-schedule-list")
                        .append($("<li>").text("Loading..."));



                    loadQuizScheduleXhr!
                        .done((data: IMoocchatApi.ToClientResponseBase<IDB_QuizSchedule[]>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            const $quizScheduleListElems = data.payload.map((quizSchedule) => {
                                return $("<li>").html(`Question ID: <a href="#" class="view-question">${quizSchedule.questionId}</a><br>Starts: ${new Date(quizSchedule.availableStart!)}<br>Ends: ${new Date(quizSchedule.availableEnd!)}<br>Blackboard Column ID: ${quizSchedule.blackboardColumnId}`);
                            });

                            page$("#quiz-schedule-list")
                                .empty()
                                .append($quizScheduleListElems)
                                .on("click", "a.view-question", (e) => {
                                    e.preventDefault();

                                    const questionId = $(e.currentTarget).text();

                                    fsm.executeTransition("load-question-details", questionId);
                                });
                        });
                });
            },

            onLeave: () => {
                loadQuizScheduleXhr && loadQuizScheduleXhr.abort();
            }
        });
    }


    {
        let loadQuestionsXhr: JQueryXHR | undefined;
        let createQuizXhr: JQueryXHR | undefined;
        let inputChanged: boolean = false;

        fsmDesc.addStateChangeHandlers(STATE.QUIZ_SCHEDULE_CREATION_PAGE, {
            onEnter: () => {
                loadQuestionsXhr = $.ajax({
                    method: "GET",
                    url: "/api/client/question",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Moocchat-Session-Id": sessionId,
                    }
                });

                pageManager.loadPage("admin-quiz-schedule-creation", (page$) => {
                    setSectionActive("quizzes");

                    page$("input, select").one("input propertychange paste", () => {
                        inputChanged = true;
                    });

                    loadQuestionsXhr!
                        .done((data: IMoocchatApi.ToClientResponseBase<IDB_Question[]>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            page$("#question-id").append(
                                data.payload.map((question) => {
                                    return $("<option>")
                                        .prop({
                                            value: question._id,
                                        })
                                        .text(question.content || "?");
                                })
                            );

                        });


                    page$("#create").one("click", (e) => {
                        e.preventDefault();

                        const questionId: string = page$("#question-id").val();
                        const availableStart: string = page$("#available-start").val();
                        const availableEnd: string = page$("#available-end").val();
                        const blackboardColumnId: string = page$("#blackboard-column-id").val();

                        createQuizXhr = $.ajax({
                            method: "POST",
                            url: "/api/client/quiz",
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify({
                                questionId,
                                availableStart,
                                availableEnd,
                                blackboardColumnId,
                            }),
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        createQuizXhr
                            .done((data: IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>) => {
                                // Must check success flag
                                if (!data.success) {
                                    // Something went wrong - check message
                                    return fsm.executeTransition("error", data.message);
                                }

                                inputChanged = false;
                                fsm.executeTransition("load-quiz-schedules");
                            });
                    });
                });
            },

            onLeave: () => {
                if (inputChanged) {
                    if (!confirm("Form content will be lost. Confirm leave?")) {
                        return false;
                    }
                }

                abortXhr([
                    loadQuestionsXhr,
                    createQuizXhr,
                ]);

                return;
            }
        });
    }


    {
        let loadQuestionDetailsXhr: JQueryXHR | undefined;
        let updateQuestionXhr: JQueryXHR | undefined;
        let deleteQuestionXhr: JQueryXHR | undefined;
        let inputChanged: boolean = false;

        fsmDesc.addStateChangeHandlers(STATE.QUESTION_DETAILS_PAGE, {
            onEnter: (_label: string, _fromState: string, _toState: string, questionId: string) => {
                loadQuestionDetailsXhr = $.ajax({
                    method: "GET",
                    url: `/api/client/question/${questionId}`,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Moocchat-Session-Id": sessionId,
                    }
                });

                pageManager.loadPage("admin-question-details", (page$) => {
                    setSectionActive("quizzes");

                    page$("#question-content").one("input propertychange paste", () => {
                        inputChanged = true;
                    });

                    page$("#discard-changes").on("click", (e) => {
                        e.preventDefault();
                        inputChanged = false;
                        fsm.executeTransition("load-questions");
                    });

                    loadQuestionDetailsXhr!
                        .done((data: IMoocchatApi.ToClientResponseBase<IDB_Question>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            page$("#question-id").text(data.payload._id || "?");
                            page$("#question-content").val(data.payload.content || "");
                        });

                    page$("#save-changes").one("click", (e) => {
                        e.preventDefault();

                        const questionContent: string = page$("#question-content").val();

                        updateQuestionXhr = $.ajax({
                            method: "PUT",
                            url: `/api/client/question/${questionId}`,
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify({
                                content: questionContent,
                            }),
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        updateQuestionXhr.done((data: IMoocchatApi.ToClientResponseBase<void>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            fsm.executeTransition("load-questions");
                        });
                    });


                    page$("#delete").one("click", (e) => {
                        e.preventDefault();

                        deleteQuestionXhr = $.ajax({
                            method: "DELETE",
                            url: `/api/client/question/${questionId}`,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        deleteQuestionXhr.done((data: IMoocchatApi.ToClientResponseBase<void>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            fsm.executeTransition("load-questions");
                        });
                    });

                });
            },

            onLeave: () => {
                if (inputChanged) {
                    if (!confirm("Form content will be lost. Confirm leave?")) {
                        return false;
                    }
                }

                loadQuestionDetailsXhr && loadQuestionDetailsXhr.abort();
                updateQuestionXhr && updateQuestionXhr.abort();
                deleteQuestionXhr && deleteQuestionXhr.abort();

                return;
            }
        });
    }


    {
        let loadQuestionsXhr: JQueryXHR | undefined;

        fsmDesc.addStateChangeHandlers(STATE.QUESTIONS_PAGE, {
            onEnter: () => {
                loadQuestionsXhr = $.ajax({
                    method: "GET",
                    url: "/api/client/question",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Moocchat-Session-Id": sessionId,
                    }
                });

                pageManager.loadPage("admin-questions", (page$) => {
                    setSectionActive("quizzes");

                    page$("#create-question").on("click", (e) => {
                        e.preventDefault();

                        fsm.executeTransition("load-question-creation");
                    });

                    page$("#question-list")
                        .append($("<li>").text("Loading..."));

                    loadQuestionsXhr!
                        .done((data: IMoocchatApi.ToClientResponseBase<IDB_Question[]>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            const $questionListElems = data.payload.map((question) => {
                                return $("<li>").html(`Question ID: <a href="#" class="view-question">${question._id}</a><br>Content: ${question.content}`);
                            });

                            page$("#question-list")
                                .empty()
                                .append($questionListElems)
                                .on("click", "a.view-question", (e) => {
                                    e.preventDefault();

                                    const questionId = $(e.currentTarget).text();

                                    fsm.executeTransition("load-question-details", questionId);
                                });
                        });
                });
            },

            onLeave: () => {
                loadQuestionsXhr && loadQuestionsXhr.abort();
            }
        });
    }


    {
        let createQuestionXhr: JQueryXHR | undefined;
        let inputChanged: boolean = false;

        fsmDesc.addStateChangeHandlers(STATE.QUESTION_CREATION_PAGE, {
            onEnter: () => {
                pageManager.loadPage("admin-question-creation", (page$) => {
                    setSectionActive("quizzes");

                    page$("#question-content").one("input propertychange paste", () => {
                        inputChanged = true;
                    });

                    page$("#create").one("click", (e) => {
                        e.preventDefault();

                        const questionContent: string = page$("#question-content").val();

                        createQuestionXhr = $.ajax({
                            method: "POST",
                            url: "/api/client/question",
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify({
                                content: questionContent,
                            }),
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        createQuestionXhr
                            .done((data: IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>) => {
                                // Must check success flag
                                if (!data.success) {
                                    // Something went wrong - check message
                                    return fsm.executeTransition("error", data.message);
                                }

                                fsm.executeTransition("load-questions");

                            });
                    });
                });
            },

            onLeave: () => {
                if (inputChanged) {
                    if (!confirm("Form content will be lost. Confirm leave?")) {
                        return false;
                    }
                }

                createQuestionXhr && createQuestionXhr.abort();

                return;
            }
        });
    }


    {
        let loadQuestionDetailsXhr: JQueryXHR | undefined;
        let updateQuestionXhr: JQueryXHR | undefined;
        let deleteQuestionXhr: JQueryXHR | undefined;
        let inputChanged: boolean = false;

        fsmDesc.addStateChangeHandlers(STATE.QUESTION_DETAILS_PAGE, {
            onEnter: (_label: string, _fromState: string, _toState: string, questionId: string) => {
                loadQuestionDetailsXhr = $.ajax({
                    method: "GET",
                    url: `/api/client/question/${questionId}`,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Moocchat-Session-Id": sessionId,
                    }
                });

                pageManager.loadPage("admin-question-details", (page$) => {
                    setSectionActive("quizzes");

                    page$("#question-content").one("input propertychange paste", () => {
                        inputChanged = true;
                    });

                    page$("#discard-changes").on("click", (e) => {
                        e.preventDefault();
                        inputChanged = false;
                        fsm.executeTransition("load-questions");
                    });

                    loadQuestionDetailsXhr!
                        .done((data: IMoocchatApi.ToClientResponseBase<IDB_Question>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            page$("#question-id").text(data.payload._id || "?");
                            page$("#question-content").val(data.payload.content || "");
                        });

                    page$("#save-changes").one("click", (e) => {
                        e.preventDefault();

                        const questionContent: string = page$("#question-content").val();

                        updateQuestionXhr = $.ajax({
                            method: "PUT",
                            url: `/api/client/question/${questionId}`,
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify({
                                content: questionContent,
                            }),
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        updateQuestionXhr.done((data: IMoocchatApi.ToClientResponseBase<void>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            fsm.executeTransition("load-questions");
                        });
                    });


                    page$("#delete").one("click", (e) => {
                        e.preventDefault();

                        deleteQuestionXhr = $.ajax({
                            method: "DELETE",
                            url: `/api/client/question/${questionId}`,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            headers: {
                                "Moocchat-Session-Id": sessionId,
                            }
                        });

                        deleteQuestionXhr.done((data: IMoocchatApi.ToClientResponseBase<void>) => {
                            // Must check success flag
                            if (!data.success) {
                                // Something went wrong - check message
                                return fsm.executeTransition("error", data.message);
                            }

                            fsm.executeTransition("load-questions");
                        });
                    });

                });
            },

            onLeave: () => {
                if (inputChanged) {
                    if (!confirm("Form content will be lost. Confirm leave?")) {
                        return false;
                    }
                }

                loadQuestionDetailsXhr && loadQuestionDetailsXhr.abort();
                updateQuestionXhr && updateQuestionXhr.abort();
                deleteQuestionXhr && deleteQuestionXhr.abort();

                return;
            }
        });
    }

    const fsm = new StateMachine(fsmDesc);
    fsm.executeTransition("startup");

});




function abortXhr(xhrArray: (JQueryXHR | undefined)[]) {
    xhrArray.forEach((xhr) => {
        xhr && xhr.abort();
    });
}



interface IDB_QuizSchedule {
    _id?: string;
    questionId?: string;
    course?: string;
    availableStart?: string;
    availableEnd?: string;
    blackboardColumnId?: number;
}
interface IDB_Question {
    _id?: string,
    content?: string,
    course?: string,
}