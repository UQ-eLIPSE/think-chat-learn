import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

import {MoocchatUser} from "../MoocchatUser";
import {MoocchatQuiz} from "../MoocchatQuiz";

export let WelcomePageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("welcome");

        return {
            onEnter: () => {
                session.pageManager.loadPage("welcome", (page$) => {
                    section.setActive();

                    page$("button").on("click", () => {
                        let username = prompt("username", "test2");

                        let user = new MoocchatUser(session.eventManager, username);

                        user.onLoginSuccess = (data) => {
                            session.setQuiz(new MoocchatQuiz(data.quiz));
                            session.setUser(user);
                            session.stateMachine.goTo(STATE.INITIAL_ANSWER);
                        }

                        user.onLoginFail = (data) => {
                            let reason: string;

                            if (typeof data === "string") {
                                // General login failure
                                reason = data;
                            } else {
                                // Login failed because user still signed in
                                reason = `User "${data.username}" is still signed in`;
                            }

                            alert(`Login failed.\n\n${reason}`);
                        }
                        
                        user.login(session.socket);
                    });

                    page$("a").on("click", () => {
                        session.stateMachine.goTo(STATE.DISCUSSION);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
