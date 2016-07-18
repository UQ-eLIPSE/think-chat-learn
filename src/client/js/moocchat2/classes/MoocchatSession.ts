import {EventBox} from "./EventBox";
import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager} from "./TaskSectionManager";
import {WebsocketManager} from "./WebsocketManager";
import {SessionStorage} from "./SessionStorage";

import {MoocchatAnalytics} from "./MoocchatAnalytics";
import {MoocchatAnalyticsCore} from "./MoocchatAnalyticsCore";
import {MoocchatUser} from "./MoocchatUser";
import {MoocchatQuiz} from "./MoocchatQuiz";
import {MoocchatSurvey} from "./MoocchatSurvey";
import {MoocchatAnswerContainer} from "./MoocchatAnswerContainer";

/**
 * MOOCchat
 * Client session module
 * 
 * Intended to act as a managed "global" across the session
 */
export class MoocchatSession<StateTypeEnum> {
    private _id: string;

    private _stateMachine: StateFlow<StateTypeEnum>;
    private _pageManager: PageManager;
    private _sectionManager: TaskSectionManager;
    private _eventManager: EventBox;

    private _analytics: MoocchatAnalytics;

    private _quiz: MoocchatQuiz;
    private _survey: MoocchatSurvey;

    public user: MoocchatUser;
    public socket: WebsocketManager;
    public answers: MoocchatAnswerContainer;

    public storage: SessionStorage;


    constructor(turnOnAnalytics: boolean = true, $content: JQuery, $taskSections: JQuery) {
        this._eventManager = new EventBox();
        this._pageManager = new PageManager(this._eventManager, $content);
        this._sectionManager = new TaskSectionManager(this._eventManager, $taskSections);
        this._stateMachine = new StateFlow<StateTypeEnum>();

        this.answers = new MoocchatAnswerContainer();
        this.storage = new SessionStorage();

        if (turnOnAnalytics) {
            this._analytics = new MoocchatAnalytics(this);
        }
    }

    public get id() {
        return this._id;
    }

    public get quiz() {
        return this._quiz;
    }

    public get survey() {
        return this._survey;
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
        return this._analytics || new MoocchatAnalyticsCore();
    }

    /**
     * Sets the session ID.
     * Only settable once; further sets are ignored.
     * 
     * @param {string} id
     * 
     * @return {this}
     */
    public setId(id: string) {
        if (!this._id) {
            this._id = id;
        }

        return this;
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
     * 
     * @param {MoocchatQuiz} quiz
     * 
     * @return {this}
     */
    public setQuiz(quiz: MoocchatQuiz) {
        this._quiz = quiz;
        return this;
    }

    /**
     * Sets the session survey.
     * 
     * @param {MoocchatSurvey} survey
     * 
     * @return {this}
     */
    public setSurvey(survey: MoocchatSurvey) {
        this._survey = survey;
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

    /**
     * Resets the answer container.
     */
    public resetAnswers() {
        this.answers.reset();
    }
}
