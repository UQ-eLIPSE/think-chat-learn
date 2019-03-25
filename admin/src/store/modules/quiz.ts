import Vue from "vue";
import { Commit, ActionTree, GetterTree } from "vuex";
import { IQuiz, QuizSessionDataObject, IChatGroup, IQuestion, IQuestionAnswerPage } from "../../../../common/interfaces/ToClientData";
import { IQuizSession, IChatMessage, Page } from "../../../../common/interfaces/DBSchema";
import { PageType } from "../../../../common/enums/DBEnums";
import { API } from "../../../../common/js/DB_API";
import { IQuizOverNetwork } from "../../../../common/interfaces/NetworkData";
import { convertNetworkQuizIntoQuiz, convertNetworkQuizzesIntoQuizzes } from "../../../../common/js/NetworkDataUtils";

type QuizSessionInfoMap = { [key: string]: QuizSessionDataObject };
type ChatGroupQuestionMessagesMap = { [chatGroupId: string]: { [questionId: string]: IChatMessage[] } };
type CurrentMarkingContext = {
    currentUserId: string | null,
    currentQuizSessionId: string | null,
    currentChatGroupId: string | null,
    currentQuizId: string | null,
    currentQuestionId: string | null
};

export interface IState {
    quiz: IQuiz[];
    course: string;
    chatGroups: any[];
    quizSessionInfoMap: QuizSessionInfoMap;
    currentMarkingContext: CurrentMarkingContext
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
        currentQuestionId: null
    }
};

const mutationKeys = {
    SET_QUIZ: "Setting a quiz",
    SET_QUIZZES: "Setting a quiz",
    DELETE_QUIZ: "Deleting a quiz",
    EDIT_QUIZ: "Editing a quiz",
    SET_COURSE: "setCourse",
    SET_CHATGROUPS: "setChatGroups"
};

const getters: GetterTree<IState, undefined> = {
    quizzes: (): IQuiz[] | null => {
        return state.quiz;
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
    currentQuiz: (state): IQuiz | undefined => {
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
    currentQuestion: (state, getters): IQuestionAnswerPage | undefined => {
        if(!getters.currentQuiz || !state.currentMarkingContext.currentQuestionId) return undefined;
        return (getters.currentQuizQuestions as IQuestionAnswerPage[]).find((q) => q.questionId === state.currentMarkingContext.currentQuestionId);
    },
    currentQuizSessionInfoObject: (state, getters): QuizSessionDataObject | undefined => {
        if(!state.currentMarkingContext || !state.currentMarkingContext.currentQuizSessionId) return undefined;
        const currentSessionId = state.currentMarkingContext.currentQuizSessionId;
        return state.quizSessionInfoMap[currentSessionId];
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
        const groupSessionInfoObjects = (currentChatGroup.quizSessionIds || []).map((qid) => state.quizSessionInfoMap[qid]);
        let currentChatGroupResponsesMap:{ [questionId: string]: Response[] }  = {};

        
        Object.keys(groupSessionInfoObjects).forEach((quizSessionId) => {
            if(!state.quizSessionInfoMap[quizSessionId]) return;
           state.quizSessionInfoMap[quizSessionId].responses.forEach((response) => {
                if(currentChatGroupResponsesMap[response.questionId] === undefined) currentChatGroupResponsesMap[response.questionId] = [];
                currentChatGroupResponsesMap[response.questionId].push(response as any);
            });
        });
        return currentChatGroupResponsesMap;
    },
    currentChatGroupQuestionResponses: (state, getters): Response[] => {
        const currentChatGroupResponsesMap = getters.currentChatGroupResponsesMap;
        if(!currentChatGroupResponsesMap || !state.currentMarkingContext.currentQuestionId) return [];
        return currentChatGroupResponsesMap[state.currentMarkingContext.currentQuestionId] || [];
    }

};
const actions: ActionTree<IState, undefined> = {
    createQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.PUT, API.QUIZ + "create", data).then((outcome: string) => {
            if (outcome) {
                commit(mutationKeys.SET_QUIZ, convertNetworkQuizIntoQuiz(data));
            }
        });
    },

    updateQuiz({ commit }: { commit: Commit }, data: IQuizOverNetwork) {
        API.request(API.POST, API.QUIZ + "update", data).then((outcome: boolean) => {
            if (outcome) {
                commit(mutationKeys.EDIT_QUIZ, convertNetworkQuizIntoQuiz(data));
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
            }
        });
    },
    async getQuizSessionInfo(context, quizSessionId: string) {
        const quizSessionResponse = await API.request(API.GET, (API.QUIZSESSION + "quizsession-marking/" + quizSessionId), {});

        const quizSession = quizSessionResponse.session as IQuizSession;
        const userSessionResponse = await API.request(API.GET, API.USERSESSION + "marking/" + quizSession.userSessionId, {});
        const userSession = userSessionResponse;
        const user = await API.request(API.GET, API.USER + "marking/" + userSessionResponse.userId, {});

        const responseResponse = await API.request(API.GET, API.RESPONSE + "/quizSession/" + quizSessionId, {});
        const responses = responseResponse.data ? responseResponse.data : [];
        const payload = { quizSession: quizSession, userSession: userSession, user: user, responses: responses } as QuizSessionDataObject;
        Vue.set(context.state.quizSessionInfoMap, quizSessionId, payload);
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
    UPDATE_CURRENT_MARKING_CONTEXT(state: IState, payload: any) {
        Vue.set(state.currentMarkingContext, payload.prop, payload.value);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
