import Vue from "vue";
import { Commit, ActionTree, GetterTree } from "vuex";
import { IQuizSession, IChatMessage, Mark } from "../../../../common/interfaces/DBSchema";
import { IQuiz, QuizSessionDataObject, IQuestionAnswerPage, ICriteria, IRubric, IChatGroupWithMarkingIndicator } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import { API } from "../../../../common/js/DB_API";
import { IQuizOverNetwork } from "../../../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz, convertNetworkQuizzesIntoQuizzes } from "../../../../common/js/NetworkDataUtils";

// Event bus for snackbar purposes
import { EventBus, EventList, SnackEvent } from "../../EventBus";

type QuizSessionInfoMap = { [key: string]: QuizSessionDataObject };

export type CurrentMarkingContext = {
    currentUserId: string | null,
    currentQuizSessionId: string | null,
    currentChatGroupId: string | null,
    currentQuizId: string | null,
    currentQuestionId: string | null,
    currentMarks: Mark | undefined | null;
};

type MarksQuestionUserMap = { [quizSessionId: string]: { [questionId: string]: { [markerId: string]: Mark } } };

/**
 * Search map for mapping quiz session id to user string
 */
export type QuizSessionToUserInfoMap = {
    [quizSessionId: string]: string
};

type QuizSessionUserSearchMap =
    { 
        [quizScheduleId: string]: QuizSessionToUserInfoMap
    };


export interface IState {
    quiz: IQuiz[];
    course: string;
    chatGroups: IChatGroupWithMarkingIndicator[];
    quizSessionInfoMap: QuizSessionInfoMap;
    currentMarkingContext: CurrentMarkingContext;
    marksQuestionUserMap: MarksQuestionUserMap;
    criterias: ICriteria[];
    rubrics: IRubric[];
    /** Tracks whether mark has been changed and has not been saved */
    MARK_CHANGED_FLAG: boolean;
    /**
     * A map which stores search maps by quiz schedule id.
     * Each search map is used to search for users by username, first name or last name for a particular quiz schedule Id.
    */
    quizSessionUserSearchMap: QuizSessionUserSearchMap;
}

const state: IState = {
    quiz: [],
    course: '',
    chatGroups: [],
    quizSessionInfoMap: {},
    currentMarkingContext: {
        currentUserId: null,
        currentQuizSessionId: null,
        currentChatGroupId: null,
        currentQuizId: null,
        currentQuestionId: null,
        currentMarks: null
    },
    marksQuestionUserMap: {},
    /**
     * A map which stores search maps by quiz id.
     * Each search map is used to search for users by username, first name or last name for a particular quiz schedule Id.
    */
    quizSessionUserSearchMap: {},
    criterias: [],
    rubrics: [],
    MARK_CHANGED_FLAG: false
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUIZZES: "Setting a collection of quizzes",
    DELETE_QUIZ: "Deleting a quiz",
    EDIT_QUIZ: "Editing a quiz",
    EDIT_QUIZ_MARKS_VISIBILITY: "Edit marks visiblity for a quiz",
    SET_CRITERIAS: "Setting the criterias",
    SET_CRITERIA: "Setting a criteria",
    DELETE_CRITERIA: "Deleting a criteria",
    SET_RUBRICS: "Setting the rubrics",
    SET_RUBRIC: "Setting a rubric",
    DELETE_RUBRIC: "Deleting a rubric",
    SET_COURSE: "setCourse",
    SET_CHATGROUPS: "setChatGroups",
    SET_QUIZSESSION_MARKED: "SET_QUIZSESSION_MARKED",
    SET_SEARCH_QUIZ_SESSIONS: "SET_SEARCH_QUIZ_SESSIONS",
    SET_CHATGROUP_MESSAGES: "SET_CHATGROUP_MESSAGES",
    SET_MARK_CHANGED_FLAG: "SET_MARK_CHANGED_FLAG"
};

const getters: GetterTree<IState, undefined> = {
    quizzes: (state): IQuiz[] | null => {
        return state.quiz;
    },
    marksMap: (state): MarksQuestionUserMap => {
        return state.marksQuestionUserMap;
    },
    quizSessionInfoMap: (): QuizSessionInfoMap => {
        return state.quizSessionInfoMap;
    },
    currentQuiz: (): IQuiz | undefined => {
        return state.quiz.find((q) => state.currentMarkingContext.currentQuizId === q._id);
    },
    currentMarkingContext: (): CurrentMarkingContext => {
        return state.currentMarkingContext;
    },
    chatGroups: () => {
        return state.chatGroups || [];
    },
    currentChatGroup: (): IChatGroupWithMarkingIndicator | undefined => {
        if (!state.chatGroups || !state.currentMarkingContext.currentChatGroupId) return undefined;
        return state.chatGroups.find((g) => g._id === state.currentMarkingContext.currentChatGroupId);
    },
    currentQuizQuestions: (): IQuestionAnswerPage[] => {
        if(!getters.currentQuiz) return [];
        const questionPages = ((getters.currentQuiz as IQuiz).pages || []).filter((p) => p.type === PageType.QUESTION_ANSWER_PAGE) as IQuestionAnswerPage[];
        return questionPages || [];
    },
    currentQuestion: (state, getters): any | undefined => {
        if(!getters.currentQuiz) return undefined;
        return ((getters.currentQuiz as IQuiz).pages || []).filter((p) => p.type === PageType.QUESTION_ANSWER_PAGE).find((qp) => (qp as IQuestionAnswerPage).questionId === state.currentMarkingContext.currentQuestionId!);
    },
    currentQuizSessionInfoObject: (state, getters): QuizSessionDataObject | undefined => {
        if(!state.currentMarkingContext || !state.currentMarkingContext.currentQuizSessionId) return undefined;
        const currentSessionId = state.currentMarkingContext.currentQuizSessionId;
        return getters.quizSessionInfoMap[currentSessionId];
    },
    currentGroupQuizSessionInfoObjects(state, getters): QuizSessionDataObject[] {
        const currentChatGroup = getters.currentChatGroup as IChatGroupWithMarkingIndicator | undefined;
        if (!currentChatGroup) return [];
        const quizSessionIdsInCurrentChatGroup = currentChatGroup.quizSessionIds;
        if (!quizSessionIdsInCurrentChatGroup) return [];
        const quizSessionInfoObjectsInCurrentChatGroup = quizSessionIdsInCurrentChatGroup.map((qid) => state.quizSessionInfoMap[qid]).filter((o) => o !== null && o !== undefined);
        
        return quizSessionInfoObjectsInCurrentChatGroup;
    },
    /**
     * Returns a questionId to question response array map per chat group
     */
    currentChatGroupResponsesMap: (state, getters): { [questionId: string]: Response[] } => {
        const currentChatGroup:  IChatGroupWithMarkingIndicator | undefined = getters.currentChatGroup;
        if(!currentChatGroup || !state.quizSessionInfoMap) return {};
        const groupSessionInfoObjectResponses = (currentChatGroup.quizSessionIds || []).filter((qid) => state.quizSessionInfoMap[qid]).map((qid) => state.quizSessionInfoMap[qid].responses);
        let map:{ [questionId: string]: any[] }  = {};

        groupSessionInfoObjectResponses.forEach((responseArray) => {
            responseArray.forEach((response) => {
                if(map[response.questionId] === undefined) map[response.questionId] = [];
                map[response.questionId].push(response);
            })
        });
        return map;
    },
    currentChatGroupQuestionResponses: (state, getters): Response[] => {
        const currentChatGroupResponsesMap = getters.currentChatGroupResponsesMap;
        if(!currentChatGroupResponsesMap || !state.currentMarkingContext.currentQuestionId) return [];
        return currentChatGroupResponsesMap[state.currentMarkingContext.currentQuestionId] || [];
    },
    currentMarks: (state, getters): Mark | undefined | null => {
        if(!getters.currentQuizSessionInfoObject) return undefined;
        return getters.currentQuizSessionInfoObject.marks;
    },
    criterias: (state): ICriteria[] => {
        return state.criterias;
    },
    course: (state): string => {
        return state.course;
    },
    rubrics: (state): IRubric[] => {
        return state.rubrics;
    },
    /** Returns the search map for the currently selected quiz */
    currentSearchMap: (state, getters) => {
        const currentQuiz = getters.currentQuiz;
        if(!currentQuiz || !currentQuiz._id) return {};
        return state.quizSessionUserSearchMap[currentQuiz._id] || {};
    },
    searchMap: (state) => {
        return state.quizSessionUserSearchMap;
    },
    isMarkChanged: (state) => {
        return state.MARK_CHANGED_FLAG === true;
    }

};
const actions: ActionTree<IState, undefined> = {
    createQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.POST, API.QUIZ + "create", data).then((output: {outgoingId: string}) => {
            if (output.outgoingId) {
                data._id = output.outgoingId;
                commit(mutationKeys.SET_QUIZ, convertNetworkQuizIntoQuiz(data));

                const message: SnackEvent = {
                    message: "Created a quiz"
                };

                EventBus.$emit(EventList.PUSH_SNACKBAR, message);
            }
        });
    },

    updateQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.PUT, API.QUIZ + "update", data).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.EDIT_QUIZ, convertNetworkQuizIntoQuiz(data));

                const message: SnackEvent = {
                    message: "Updated a quiz"
                };

                EventBus.$emit(EventList.PUSH_SNACKBAR, message);
            }
        });
    },
    async updateQuizMarksVisibility({ commit }: { commit: Commit }, data: { quizScheduleId: string, marksPublic: boolean }) {
        try {
            if(!data || !data.quizScheduleId) throw new Error('Invalid quiz quizScheduleId supplied');
            const response = await API.request(API.PUT, API.QUIZ + 'marks-visibility', data);
            if(response && response.success) {
                commit(mutationKeys.EDIT_QUIZ_MARKS_VISIBILITY, data);

                EventBus.$emit(EventList.PUSH_SNACKBAR, {
                    message: data.marksPublic? `Marks are visible to students`:
                    `Marks will not be displayed to students`
                });
            }
        } catch(e) {
            EventBus.$emit(EventList.PUSH_SNACKBAR, {
                message: `Marks visibility settings could not be updated`,
                error: true
            });
        }
    },
    getQuizzes(context, courseId: string) {
        API.request(API.GET, API.QUIZ + "course/" + courseId, {}).then((output: IQuizOverNetwork[]) => {
            context.commit(mutationKeys.SET_QUIZZES, convertNetworkQuizzesIntoQuizzes(output));
        });
    },
    async getChatGroups({ commit }: { commit: Commit }, quizId: string) {
        await API.request(API.GET, API.CHATGROUP + `getChatGroups?quizid=${quizId}`, {}).then((output: { success: boolean, payload?: any[] }) => {
            if(output && output.success && output.payload) {
                commit(mutationKeys.SET_CHATGROUPS, output.payload);
            }
        });
    },
    setQuizzes({ commit }: { commit: Commit }, data: IQuiz[]) {
        commit(mutationKeys.SET_QUIZZES, data);
    },
    deleteQuiz({ commit }: { commit: Commit }, data: string) {
        API.request(API.DELETE, API.QUIZ + "delete/" + data, {}).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.DELETE_QUIZ, data);

                const message: SnackEvent = {
                    message: "Deleted a quiz"
                };
                
                EventBus.$emit(EventList.PUSH_SNACKBAR, message);
            }
        });
    },
    async getQuizSessionInfo(context, quizSessionId: string) {
        // Fetch quiz session by quiz session id
        const quizSessionResponse = await API.request(API.GET, (API.QUIZSESSION + "quizsession-marking/" + quizSessionId), {});

        const quizSession = quizSessionResponse.session as IQuizSession;
        
        // Fetch user session by user session id
        const userSessionResponse = await API.request(API.GET, API.USERSESSION + "marking/" + quizSession.userSessionId, {});
        const userSession = userSessionResponse;
        
        // Fetch user by userId
        const user = await API.request(API.GET, API.USER + "marking/" + userSessionResponse.userId, {});

        // Fetch responses by quiz session id
        const responseResponse = await API.request(API.GET, API.RESPONSE + "quizSession/" + quizSessionId, {});
        const responses = responseResponse.data ? responseResponse.data : [];

        const payload = { quizSession: quizSession, userSession: userSession, user: user, responses: responses } as QuizSessionDataObject;
        Vue.set(context.state.quizSessionInfoMap, quizSessionId, payload);
    },
    async getQuizSessionInfoForMarking(context, quizSessionId: string) {
        // Fetch quiz session by quiz session id
        const quizSessionResponse = await API.request(API.GET, (API.QUIZSESSION + "quizsession-marking/" + quizSessionId), {});

        const quizSession = quizSessionResponse.session as IQuizSession;
        
        // Fetch user session by user session id
        const userSessionResponse = await API.request(API.GET, API.USERSESSION + "marking/" + quizSession.userSessionId, {});
        const userSession = userSessionResponse;
        
        // Fetch user by userId
        const user = await API.request(API.GET, API.USER + "marking/" + userSessionResponse.userId, {});

        const payload = { quizSession: quizSession, userSession: userSession, user: user, responses: [] } as QuizSessionDataObject;
        Vue.set(context.state.quizSessionInfoMap, quizSessionId, payload);
    },

    setCourse({ commit }: { commit: Commit }, data: string) {
        commit(mutationKeys.SET_COURSE, data);
    },

    setCriterias({ commit }: { commit: Commit }, data: ICriteria[]) {
        commit(mutationKeys.SET_CRITERIAS, data);
    },

    async sendCriteria({ commit }: { commit: Commit }, data: ICriteria) {
        if (data._id) {
            await API.request(API.PUT, API.CRITERIA + "update/", data);

            const index = state.criterias.findIndex((criteria) => {
                return criteria._id === data._id;
            });

            commit(mutationKeys.SET_CRITERIA, { criteria: data, index });

            const message: SnackEvent = {
                message: "Updated a criteria"
            };

            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
        } else {
            const id: {outgoingId: string } = await API.request(API.POST, API.CRITERIA + "create/", data);
            data._id = id.outgoingId;
            commit(mutationKeys.SET_CRITERIA, { criteria: data, index: state.criterias.length });

            const message: SnackEvent = {
                message: "Created a new criteria"
            };

            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
        }
    },

    async deleteCriteria({ commit }: { commit: Commit }, id: string) {
        await API.request(API.DELETE, API.CRITERIA + "delete/" + id, {});

        const index = state.criterias.findIndex((criteria) => {
            return criteria._id === id;
        });

        commit(mutationKeys.DELETE_CRITERIA, index);

        const message: SnackEvent = {
            message: "Deleted a criteria"
        };        

        EventBus.$emit(EventList.PUSH_SNACKBAR, message);
    },

    setRubrics({ commit }: { commit: Commit }, data: IRubric[]) {
        commit(mutationKeys.SET_RUBRICS, data);
    },

    async sendRubric({ commit }: { commit: Commit }, data: IRubric) {
        if (data._id) {
            await API.request(API.POST, API.RUBRIC + "update/", data);

            const index = state.rubrics.findIndex((rubric) => {
                return rubric._id === data._id;
            });

            commit(mutationKeys.SET_RUBRIC, { rubric: data, index });

            const message: SnackEvent = {
                message: "Updated a rubric"
            };

            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
        } else {
            const id: {outgoingId: string } = await API.request(API.PUT, API.RUBRIC + "create/", data);
            data._id = id.outgoingId;
            commit(mutationKeys.SET_RUBRIC, { rubric: data, index: state.rubrics.length });

            const message: SnackEvent = {
                message: "Created a new rubric"
            };

            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
        }
    },

    async deleteRubric({ commit }: { commit: Commit }, id: string) {
        await API.request(API.DELETE, API.RUBRIC + "delete/" + id, {});

        const index = state.rubrics.findIndex((rubric) => {
            return rubric._id === id;
        });

        commit(mutationKeys.DELETE_RUBRIC, index);

        const message: SnackEvent = {
            message: "Deleted a rubric"
        };

        EventBus.$emit(EventList.PUSH_SNACKBAR, message);
    },
    
    /**
     * For a given quiz schedule id, fetches a map of quiz session ids to user information strings
     * Used for search functionality.
     * @param quizScheduleId Quiz schedule id
     */
    async getQuizSessionUserMap({ commit }: { commit: Commit }, quizScheduleId: string) {
        const response = await API.request(API.GET, API.QUIZSESSION + `searchmap/${quizScheduleId}`, {}, undefined);
  
        if(response && response.success && response.payload) {
            commit(mutationKeys.SET_SEARCH_QUIZ_SESSIONS, { quizScheduleId, payload: response.payload });
        }
    },

    /**
     * Fetches messages for a chat group from the server
     * @param chatGroupId Chat group ID
     */
    async fetchChatGroupMessages({ commit }: { commit: Commit }, chatGroupId: string) {
        const group = (state.chatGroups || []).find((group) => group._id === chatGroupId);
        if(!group) return;
        
        const response = await API.request(API.GET, API.CHATGROUP + `${chatGroupId}/messages`, {}, undefined);
        if(response && response.success && response.payload) {
            commit(mutationKeys.SET_CHATGROUP_MESSAGES, { chatGroupId, messages: response.payload || []});
        }
    }
};

const mutations = {
    [mutationKeys.SET_QUIZ](funcState: IState, data: IQuiz) {
        Vue.set(funcState.quiz, funcState.quiz.length, data);
    },
    [mutationKeys.SET_QUIZZES](funcState: IState, data: IQuiz[]) {
        Vue.set(funcState, "quiz", data);
    },
    [mutationKeys.DELETE_QUIZ](funcState: IState, data: string) {
        const index = funcState.quiz.findIndex((element) => {
            return element._id === data;
        });

        Vue.delete(funcState.quiz, index);
    },
    [mutationKeys.EDIT_QUIZ](funcState: IState, data: IQuiz) {
        const index = funcState.quiz.findIndex((element) => {
            return element._id === data._id;
        });

        if (index !== -1) {
            Vue.set(funcState.quiz, index, data);
        }
    },
    [mutationKeys.EDIT_QUIZ_MARKS_VISIBILITY](funcState: IState, data: { quizScheduleId: string, marksPublic: boolean }) {
        const index = funcState.quiz.findIndex((element) => {
            return element._id === data.quizScheduleId;
        });

        if (index !== -1) {
            Vue.set(funcState.quiz[index], 'marksPublic', !!data.marksPublic);
        }
    },
    [mutationKeys.SET_COURSE](funcState: IState, course: string) {
        funcState.course = course;
    },
    [mutationKeys.SET_CHATGROUPS](funcState: IState, chatGroups: IChatGroupWithMarkingIndicator[]) {
        funcState.chatGroups = chatGroups;
    },
    [mutationKeys.SET_CRITERIAS](funcState: IState, criterias: ICriteria[]) {
        Vue.set(funcState, "criterias", criterias);
    },
    [mutationKeys.SET_CRITERIA](funcState: IState, data: { criteria: ICriteria, index: number }) {
        Vue.set(funcState.criterias, data.index, data.criteria);
    },
    [mutationKeys.DELETE_CRITERIA](funcState: IState, index: number) {
        Vue.delete(funcState.criterias, index);
    },
    [mutationKeys.SET_RUBRICS](funcState: IState, rubrics: IRubric[]) {
        Vue.set(funcState, "rubrics", rubrics);
    },
    [mutationKeys.SET_RUBRIC](funcState: IState, data: { rubric: IRubric, index: number }) {
        Vue.set(funcState.rubrics, data.index, data.rubric);
    },
    [mutationKeys.DELETE_RUBRIC](funcState: IState, index: number) {
        Vue.delete(funcState.rubrics, index);
    },    
    UPDATE_CURRENT_MARKING_CONTEXT(state: IState, payload: any) {
        Vue.set(state.currentMarkingContext, payload.prop, payload.value);
    },
    SET_MARKS(state: IState, payload: any) {
        const newObject = Object.assign({}, state.quizSessionInfoMap[payload.quizSessionId], { marks: payload.marks });
        Vue.set(state.quizSessionInfoMap, payload.quizSessionId, newObject);
    },
    /** Sets the marking indicator for a quiz session in a group */
    [mutationKeys.SET_QUIZSESSION_MARKED](state: IState, payload: { marked: boolean, quizSessionId: string, chatGroupId: string }) {
        const chatGroup = state.chatGroups && state.chatGroups.find((group) => group._id === payload.chatGroupId);

        // If a chat group is found, mark quiz session as supplied `marked` value in `payload`
        chatGroup && chatGroup.quizSessionMarkedMap && Vue.set(chatGroup.quizSessionMarkedMap, payload.quizSessionId, payload.marked);
    },
    [mutationKeys.SET_SEARCH_QUIZ_SESSIONS](state: IState, payload: { quizScheduleId: string, payload: QuizSessionToUserInfoMap }) {
        Vue.set(state.quizSessionUserSearchMap, payload.quizScheduleId, payload.payload);
    },
    [mutationKeys.SET_CHATGROUP_MESSAGES](state: IState, payload: { messages: IChatMessage[], chatGroupId: string }) {
        const chatGroup = state.chatGroups.find((group) => group._id === payload.chatGroupId);
        if(chatGroup) {
            Vue.set(chatGroup, 'messages', payload.messages);
        }
    },
    [mutationKeys.SET_MARK_CHANGED_FLAG](state: IState, payload: boolean) {
        state.MARK_CHANGED_FLAG = payload;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
