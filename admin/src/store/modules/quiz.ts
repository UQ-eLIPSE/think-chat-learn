import Vue from "vue";
import { Commit, ActionTree, GetterTree } from "vuex";
import { IQuiz, QuizSessionDataObject, IChatGroup, IQuestion,
    IQuestionAnswerPage, ICriteria, IRubric } from "../../../../common/interfaces/ToClientData";
import { IQuizSession, IChatMessage, Page, Mark } from "../../../../common/interfaces/DBSchema";
import { PageType } from "../../../../common/enums/DBEnums";
import { API } from "../../../../common/js/DB_API";
import { IQuizOverNetwork } from "../../../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz, convertNetworkQuizzesIntoQuizzes } from "../../../../common/js/NetworkDataUtils";

// Event bus for snackbar purposes
import { EventBus, EventList } from "../../EventBus";

type QuizSessionInfoMap = { [key: string]: QuizSessionDataObject };
type ChatGroupQuestionMessagesMap = { [chatGroupId: string]: { [questionId: string]: IChatMessage[] } };
export type CurrentMarkingContext = {
    currentUserId: string | null,
    currentQuizSessionId: string | null,
    currentChatGroupId: string | null,
    currentQuizId: string | null,
    currentQuestionId: string | null,
    currentMarks: Mark | undefined | null;
};

type MarksQuestionUserMap = { [quizSessionId: string]: { [questionId: string]: { [markerId: string]: Mark } } };

export interface IState {
    quiz: IQuiz[];
    course: string;
    chatGroups: any[];
    quizSessionInfoMap: QuizSessionInfoMap;
    currentMarkingContext: CurrentMarkingContext;
    marksQuestionUserMap: MarksQuestionUserMap;
    criterias: ICriteria[];
    rubrics: IRubric[];
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
    criterias: [],
    rubrics: [],
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUIZZES: "Setting a collection of quizzes",
    DELETE_QUIZ: "Deleting a quiz",
    EDIT_QUIZ: "Editing a quiz",
    SET_CRITERIAS: "Setting the criterias",
    SET_CRITERIA: "Setting a criteria",
    DELETE_CRITERIA: "Deleting a criteria",
    SET_RUBRICS: "Setting the rubrics",
    SET_RUBRIC: "Setting a rubric",
    DELETE_RUBRIC: "Deleting a rubric",
    SET_COURSE: "setCourse",
    SET_CHATGROUPS: "setChatGroups"
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
    chatGroupQuestionMessagesMap: (state): ChatGroupQuestionMessagesMap => {
        const chatGroups: IChatGroup[] = state.chatGroups || [];
        const map: ChatGroupQuestionMessagesMap = {};
        chatGroups.forEach((g) => {
            if (!g || !g._id) return;
            if (!map[g._id]) map[g._id] = {};
            (g.messages || []).forEach((m) => {
                if (m) {
                    if (!map[g!._id!][m.questionId]) map[g!._id!][m.questionId] = [];
                    map[g!._id!][m.questionId].push(m);
                }
            })
        });
        return map;
    },
    currentQuiz: (): IQuiz | undefined => {
        return state.quiz.find((q) => state.currentMarkingContext.currentQuizId === q._id);
    },
    currentMarkingContext: (): CurrentMarkingContext => {
        return state.currentMarkingContext;
    },
    chatGroups: (): IChatGroup[] => {
        return state.chatGroups || [];
    },
    currentChatGroup: (): IChatGroup | undefined => {
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
        const currentChatGroup = getters.currentChatGroup as IChatGroup | undefined;
        if (!currentChatGroup) return [];
        const quizSessionIdsInCurrentChatGroup = currentChatGroup.quizSessionIds;
        if (!quizSessionIdsInCurrentChatGroup) return [];
        const quizSessionInfoObjectsInCurrentChatGroup = quizSessionIdsInCurrentChatGroup.map((qid) => state.quizSessionInfoMap[qid]).filter((o) => o !== null && o !== undefined);
        
        return quizSessionInfoObjectsInCurrentChatGroup;
    },
    currentChatGroupQuestionMessageMap: (state, getters): { [questionId: string]: IChatMessage[]} => {
        if(!(getters.currentChatGroup as IChatGroup | undefined) || !state.currentMarkingContext.currentQuestionId) return {};
        const currentChatGroupId = getters.currentChatGroup._id;
        const currentChatGroupQuestionMessageMap = getters.chatGroupQuestionMessagesMap[currentChatGroupId];
        return currentChatGroupQuestionMessageMap;
    },
    currentChatGroupQuestionMessages: (state, getters): IChatMessage[] => {
        const currentChatGroupQuestionMessageMap = getters.chatGroupQuestionMessagesMap;
        if(!currentChatGroupQuestionMessageMap || !state.currentMarkingContext.currentChatGroupId || !state.currentMarkingContext.currentQuestionId) return [];
        if(!currentChatGroupQuestionMessageMap[state.currentMarkingContext.currentChatGroupId]) return [];
        return currentChatGroupQuestionMessageMap[state.currentMarkingContext.currentChatGroupId][state.currentMarkingContext.currentQuestionId] || [];
    },
    currentChatGroupResponsesMap: (state, getters): { [questionId: string]: Response[] } => {
        const currentChatGroup:  IChatGroup | undefined = getters.currentChatGroup;
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
    }

};
const actions: ActionTree<IState, undefined> = {
    createQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.PUT, API.QUIZ + "create", data).then((outcome: string) => {
            if (outcome) {
                commit(mutationKeys.SET_QUIZ, convertNetworkQuizIntoQuiz(data));
                EventBus.$emit(EventList.PUSH_SNACKBAR, "Created a quiz");
            }
        });
    },

    updateQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.POST, API.QUIZ + "update", data).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.EDIT_QUIZ, convertNetworkQuizIntoQuiz(data));
                EventBus.$emit(EventList.PUSH_SNACKBAR, "Updated a Quiz");
            }
        });
    },

    getQuizzes(context, courseId: string) {
        API.request(API.GET, API.QUIZ + "course/" + courseId, {}).then((output: IQuizOverNetwork[]) => {
            context.commit(mutationKeys.SET_QUIZZES, convertNetworkQuizzesIntoQuizzes(output));
        });
    },
    async getChatGroups({ commit }: { commit: Commit }, quizId: string) {
        await API.request(API.GET, API.CHATGROUP + `getChatGroups?quizid=${quizId}`, {}).then((output: any[]) => {
            commit(mutationKeys.SET_CHATGROUPS, output);
        });
    },
    setQuizzes({ commit }: { commit: Commit }, data: IQuiz[]) {
        commit(mutationKeys.SET_QUIZZES, data);
    },
    deleteQuiz({ commit }: { commit: Commit }, data: string) {
        API.request(API.DELETE, API.QUIZ + "delete/" + data, {}).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.DELETE_QUIZ, data);
                EventBus.$emit(EventList.PUSH_SNACKBAR, "Deleted a quiz");
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
            await API.request(API.POST, API.CRITERIA + "update/", data);

            const index = state.criterias.findIndex((criteria) => {
                return criteria._id === data._id;
            });

            commit(mutationKeys.SET_CRITERIA, { criteria: data, index });
            EventBus.$emit(EventList.PUSH_SNACKBAR, "Updated Criteria");
        } else {
            const id: {outgoingId: string } = await API.request(API.PUT, API.CRITERIA + "create/", data);
            data._id = id.outgoingId;
            commit(mutationKeys.SET_CRITERIA, { criteria: data, index: state.criterias.length });
            EventBus.$emit(EventList.PUSH_SNACKBAR, "Created new Criteria");
        }
    },

    async deleteCriteria({ commit }: { commit: Commit }, id: string) {
        await API.request(API.DELETE, API.CRITERIA + "delete/" + id, {});

        const index = state.criterias.findIndex((criteria) => {
            return criteria._id === id;
        });

        commit(mutationKeys.DELETE_CRITERIA, index);
        EventBus.$emit(EventList.PUSH_SNACKBAR, "Delete Criteria");
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
            EventBus.$emit(EventList.PUSH_SNACKBAR, "Updated a rubric");
        } else {
            const id: {outgoingId: string } = await API.request(API.PUT, API.RUBRIC + "create/", data);
            data._id = id.outgoingId;
            commit(mutationKeys.SET_RUBRIC, { rubric: data, index: state.rubrics.length });
            EventBus.$emit(EventList.PUSH_SNACKBAR, "Created new a new rubric");
        }
    },

    async deleteRubric({ commit }: { commit: Commit }, id: string) {
        await API.request(API.DELETE, API.RUBRIC + "delete/" + id, {});

        const index = state.rubrics.findIndex((rubric) => {
            return rubric._id === id;
        });

        commit(mutationKeys.DELETE_RUBRIC, index);
        EventBus.$emit(EventList.PUSH_SNACKBAR, "Deleted a Rubric");
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
    [mutationKeys.SET_COURSE](funcState: IState, course: string) {
        funcState.course = course;
    },
    [mutationKeys.SET_CHATGROUPS](funcState: IState, chatGroups: any[]) {
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
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
