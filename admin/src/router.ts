import Vue from "vue";
import Router from "vue-router";
import Landing from "./components/Landing.vue";
import Login from "./components/Login.vue";
import QuizPage from "./components/QuizPage.vue";
import QuestionPage from "./components/QuestionPage.vue";
import QuestionList from "./components/QuestionList.vue";
import RubricList from "./components/RubricList.vue";
import RubricEditor from "./components/RubricEditor.vue";
import CriteriaList from "./components/CriteriaList.vue";
import CriteriaEditor from "./components/CriteriaEditor.vue";
import QuizList from "./components/QuizList.vue";
import MarkQuiz from "./views/MarkQuiz.vue";
import QuizMarkViewer from "./views/QuizMarkViewer.vue";
import Marking from './views/Marking.vue';
import MarkPlaceholder from './components/Marking/MarkPlaceholder.vue';
import store from './store';
import * as Schema from '../../common/interfaces/DBSchema';
import  { confirmMarkNavigateAway } from "./util/MarkChangeTracker";

Vue.use(Router);

// Note that the router config is done in the vue.config.js file
const router = new Router({
  routes: [
    {
      path: "/",
      name: "landing",
      component: Landing
    }, {
      path: "/login",
      name: "Login",
      component: Login
    }, {
      path: "/quizPage",
      name: "Quiz Page",
      component: QuizPage,
      props: (route) => ({ id: route.query.q })
    }, {
      path: "/questionPage",
      name: "Question Page",
      component: QuestionPage,
      props: (route) => ({ id: route.query.q })
    }, {
      path: "/questionList",
      name: "Question List",
      component: QuestionList
    }, {
      path: "/quizList",
      name: "Quiz List",
      component: QuizList
    },
    {
      path: "/criteria",
      name: "Criteria",
      component: CriteriaList
    },
    {
      path: "/criteriaEditor",
      name: "Criteria Editor",
      component: CriteriaEditor,
      props: (route) => ({ id: route.query.c })
    },
    {
      path: "/rubric",
      name: "Rubric",
      component: RubricList
    },
    {
      path: "/rubricEditor",
      name: "Rubric Editor",
      component: RubricEditor,
      props: (route) => ({ id: route.query.r })
    },  
    {
      path: "/marking",
      name: "marking",
      component: Marking
    },
    {
      path: '/mark-quiz/:id',
      name: 'mark-quiz-main',
      component: MarkPlaceholder,
      children: [
        {
          path: 'mark',
          name: 'mark-quiz',
          component: MarkQuiz
        },
        {
          path: 'view-marks',
          name: 'view-mark-quiz',
          component: QuizMarkViewer
        }
      ],
      beforeEnter: async(to: any, from: any, next: any) => {
        try {
          if (!to.params.id) {
            // Error
            console.log('Quiz ID not present')
          }

          const quizId = to.params.id;
          store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: quizId });
          store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizSessionId', value: null });
          store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuestionId', value: null });
          store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentMarks', value: null });
          store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentChatGroupId', value: null });
          await store.dispatch("getChatGroups", quizId);
          
          next();
        } catch (e) {
          // TODO: Handle Errors
        }
      }
    }
  ]
});

// Navigation guard to check for `login`
router.beforeEach((to, from, next) => {
  const course = store.getters.course;
  const user = store.getters.user;

  // Check if `course` and `user` exist in store
  if ((!course || !user) && !(to.name === "Login")) {
    // If user/course does not exist, use jwt to fetch and re-instantiate user and course details
    next({ name: 'Login' });
  } else if(from.path.includes('mark-quiz') && !to.path.includes('mark-quiz')) { 
    // Check if user is navigating to a different route other than marking, and mark has unsaved changes
    const allowNavigateAway = confirmMarkNavigateAway();

    if(allowNavigateAway) {
      // If marks has no unsaved changes / user allows navigating away, continue to route
      next();
    }
  } else {
    next();
  }
});

export default router;
