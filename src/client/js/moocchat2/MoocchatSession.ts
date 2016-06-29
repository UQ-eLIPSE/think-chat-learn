import {EventBox} from "./EventBox";
import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager} from "./TaskSectionManager";
import {WebsocketManager} from "./Websockets";

import {MoocchatAnalytics} from "./MoocchatAnalytics";
import {MoocchatUser} from "./MoocchatUser";
import {MoocchatQuiz} from "./MoocchatQuiz";

/**
 * MOOCchat
 * Client session module
 * 
 * Intended to act as a managed "global" across the session
 */
export class MoocchatSession<StateTypeEnum> {
    private _stateMachine: StateFlow<StateTypeEnum>;
    private _pageManager: PageManager;
    private _sectionManager: TaskSectionManager;
    private _eventManager: EventBox;

    private _analytics: MoocchatAnalytics;

    private _quiz: MoocchatQuiz;

    public user: MoocchatUser;
    public socket: WebsocketManager;

    constructor($content: JQuery, $taskSections: JQuery) {
        this._eventManager = new EventBox();
        this._pageManager = new PageManager(this._eventManager, $content);
        this._sectionManager = new TaskSectionManager(this._eventManager, $taskSections);
        this._stateMachine = new StateFlow<StateTypeEnum>();
        this._analytics = new MoocchatAnalytics(this);
    }

    /**
     * Sets the session socket.
     * 
     * @param {WebsocketManager} socket
     * 
     * @return {this}
     */
    public setSocket(socket: WebsocketManager) {
        this.socket = socket;
        return this;
    }

    /**
     * Sets the session user.
     * 
     * @param {MoocchatUser} user
     * 
     * @return {this}
     */
    public setUser(user: MoocchatUser) {
        this.user = user;
        return this;
    }

    /**
     * Sets the session quiz/question.
     * Only settable once; further sets are ignored.
     * 
     * @param {MoocchatQuiz} quiz
     * 
     * @return {this}
     */
    public setQuiz(quiz: MoocchatQuiz) {
        if (!this._quiz) {
            this._quiz = quiz;
        }

        return this;
    }

    /**
     * Sets the session state machine.
     * Only settable once; further sets are ignored.
     * 
     * @param {StateFlow} stateMachine
     * 
     * @return {this}
     */
    public setStateMachine(stateMachine: StateFlow<StateTypeEnum>) {
        if (!this._stateMachine) {
            this._stateMachine = stateMachine;
        }

        return this;
    }

    /**
     * Sets the session page/presentation manager.
     * Only settable once; further sets are ignored.
     * 
     * @param {PageManager} pageManager
     * 
     * @return {this}
     */
    public setPageManager(pageManager: PageManager) {
        if (!this._pageManager) {
            this._pageManager = pageManager;
        }

        return this;
    }

    /**
     * Sets the session task section manager (the left sidebar management object)
     * Only settable once; further sets are ignored.
     * 
     * @param {PageManager} pageManager
     * 
     * @return {this}
     */
    public setSectionManager(sectionManager: TaskSectionManager) {
        if (!this._sectionManager) {
            this._sectionManager = sectionManager;
        }

        return this;
    }

    /**
     * Sets the session event manager.
     * Only settable once; further sets are ignored.
     * 
     * @param {EventBox} eventManager
     * 
     * @return {this}
     */
    public setEventManager(eventManager: EventBox) {
        if (!this._eventManager) {
            this._eventManager = eventManager;
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

    public get eventManager() {
        return this._eventManager;
    }

    public get analytics() {
        return this._analytics;
    }

}
