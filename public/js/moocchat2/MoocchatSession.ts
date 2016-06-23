import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager} from "./TaskSectionManager";
import {WebsocketManager} from "./Websockets";

import {MoocchatUser} from "./MoocchatUser";
import {MoocchatQuiz} from "./MoocchatQuiz";

/*
 * MOOCchat
 * Client session module
 * 
 * Intended to act as a managed "global" across the session
 */

export class MoocchatSession<StateTypeEnum> {
    private _stateMachine: StateFlow<StateTypeEnum>;
    private _pageManager: PageManager;
    private _sectionManager: TaskSectionManager;

    private _quiz: MoocchatQuiz;

    public user: MoocchatUser;
    public socket: WebsocketManager;

    public setSocket(socket: WebsocketManager) {
        this.socket = socket;
        return this;
    }

    public setUser(user: MoocchatUser) {
        this.user = user;
        return this;
    }

    public setQuiz(quiz: MoocchatQuiz) {
        if (!this._quiz) {
            this._quiz = quiz;
        }

        return this;
    }

    public setStateMachine(stateMachine: StateFlow<StateTypeEnum>) {
        if (!this._stateMachine) {
            this._stateMachine = stateMachine;
        }

        return this;
    }

    public setPageManager(pageManager: PageManager) {
        if (!this._pageManager) {
            this._pageManager = pageManager;
        }

        return this;
    }

    public setTaskSectionManager(sectionManager: TaskSectionManager) {
        if (!this._sectionManager) {
            this._sectionManager = sectionManager;
        }

        return this;
    }

    public get quiz() {
        return this._quiz;
    }

    public get stateMachine() {
        return this._stateMachine;
    }

    public get pageManager() {
        return this._pageManager;
    }

    public get sectionManager() {
        return this._sectionManager;
    }

}
