import {Conf} from "../config/Conf";

import {EventBox} from "../../common/js/EventBox";
import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {CombinedPageManager} from "./CombinedPageManager";
import {TaskSectionManager} from "./TaskSectionManager";
import {WebsocketManager} from "./WebsocketManager";
import {SessionStorage} from "./SessionStorage";

import {MoocchatAnalytics} from "./MoocchatAnalytics";
import {MoocchatAnalyticsCore} from "./MoocchatAnalyticsCore";
import {MoocchatUser} from "./MoocchatUser";
import {MoocchatQuiz} from "./MoocchatQuiz";
import {MoocchatSurvey} from "./MoocchatSurvey";
import {MoocchatAnswerContainer} from "./MoocchatAnswerContainer";

import {WebsocketEvents} from "./WebsocketEvents";
import * as IWSToServerData from "../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../common/interfaces/IWSToClientData";

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

    private _consent: boolean;

    constructor($content: JQuery, $taskSections: JQuery, turnOnAnalytics: boolean = true) {
        this._eventManager = new EventBox();
        this._pageManager = new CombinedPageManager(this._eventManager, $content, Conf.combinedHTML.url);
        this._sectionManager = new TaskSectionManager(this._eventManager, $taskSections);
        this._stateMachine = new StateFlow<StateTypeEnum>();

        this.answers = new MoocchatAnswerContainer();
        this.storage = new SessionStorage();

        // Research consent is always null by default as we need to capture user input
        this._consent = null;

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

    public get consent() {
        return this._consent;
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
     * Sets the research consent flag for this session.
     * Only settable once; further sets are ignored.
     * 
     * @param {boolean} consent
     * 
     * @return {this}
     */
    public setConsent(consent: boolean) {
        if (!(this._consent === false || this._consent === true)) {
            this._consent = consent;
        }

        return this;
    }

    /**
     * Resets the answer container.
     */
    public resetAnswers() {
        this.answers.reset();
    }


    public logout(callback?: () => void) {
        if (this.id) {
            this.socket.once<IWSToClientData.LogoutSuccess>(WebsocketEvents.INBOUND.LOGOUT_SUCCESS, (data) => {
                if (callback) {
                    callback();
                }
            });

            this.socket.emitData<IWSToServerData.Logout>(WebsocketEvents.OUTBOUND.LOGOUT, {
                sessionId: this.id
            });
        }
    }
}
