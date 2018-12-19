import { Logger } from "../common/js/Logger";
import App from "./App";


// Initialise logger proxy for timestamping console output
Logger.Init({
    enableLogProxy: true,
    enableTimestamp: true,
});

// If there are exceptions, we should try to have the whole stack outputted to the log
process.on("uncaughtException", (e: Error) => {
    console.error(e.stack || e);
});



console.log("Setting up server application...");

// Launch the app
//const app = express();
const app: App = new App();
app.init();

/*
// Admin

// GETs
AssociateGETEndpoint("/api/admin/permissionTest", Api.Admin.Get_PermissionTest);
AssociateGETEndpoint("/api/admin/quiz", Api.Quiz.Gets);
AssociateGETEndpoint("/api/admin/quiz/upcoming", Api.Quiz.Gets_NowFuture);
AssociateGETEndpoint("/api/admin/quiz/:quizId", Api.Quiz.Get);
// AssociateGETEndpoint("/api/admin/quiz/:quizId/session", undefined);
AssociateGETEndpoint("/api/admin/quiz/:quizId/mark", Api.Mark.Gets_WithQuizId);
AssociateGETEndpoint("/api/admin/quiz/:quizId/quizAttempt_user", Api.QuizAttempt_User.Gets_WithQuizId);
AssociateGETEndpoint("/api/admin/quiz/:quizId/chatGroup", Api.ChatGroup.Gets_WithQuizId);
AssociateGETEndpoint("/api/admin/quiz/:quizId/chatMessage", Api.ChatMessage.Gets_WithQuizId);
AssociateGETEndpoint("/api/admin/quiz/:quizId/questionResponse", Api.QuestionResponse.Gets_WithQuizId);
AssociateGETEndpoint("/api/admin/quizAttempt/:quizAttemptId/mark", Api.Mark.Gets_WithQuizAttemptId);
AssociateGETEndpoint("/api/admin/quizAttempt/:quizAttemptId/mark-multiple", Api.Mark.Gets_WithQuizAttemptId_Multiple_Markers_Mode);
AssociateGETEndpoint("/api/admin/question", Api.Question.Gets);
AssociateGETEndpoint("/api/admin/question/:questionId", Api.Question.Get);
AssociateGETEndpoint("/api/admin/question/:questionId/option", Api.QuestionOption.Gets_WithQuestionId);
AssociateGETEndpoint("/api/admin/question/:questionId/correctOption", Api.QuestionOptionCorrect.Gets_WithQuestionId);
// AssociateGETEndpoint("/api/admin/questionOption", undefined);
// AssociateGETEndpoint("/api/admin/questionOption/:questionOptionId", undefined);
AssociateGETEndpoint("/api/admin/user", Api.User.Gets);
AssociateGETEndpoint("/api/admin/user/:userId", Api.User.Get);
AssociateGETEndpoint("/api/admin/user/multiple/:userId",  Api.User.Get_Multiple_Markers_Mode);
AssociateGETEndpoint("/api/admin/user/:userId/session", Api.UserSession.Gets_WithUserId);
AssociateGETEndpoint("/api/admin/system/info", Api.System.Get_Info);
// AssociateGETEndpoint("/api/admin/mark/:markId", Api.Mark.Get);
// POSTs
AssociatePOSTEndpoint("/api/admin/quiz", Api.Quiz.Post);
AssociatePOSTEndpoint("/api/admin/question", Api.Question.Post);
AssociatePOSTEndpoint("/api/admin/question/:questionId/option", Api.QuestionOption.Post_WithQuestionId);
AssociatePOSTEndpoint("/api/admin/mark", Api.Mark.Post);
AssociatePOSTEndpoint("/api/admin/mark-multiple", Api.Mark.Post_Multiple_Markers_Mode);



// PUTs
AssociatePUTEndpoint("/api/admin/quiz/:quizId", Api.Quiz.Put);
AssociatePUTEndpoint("/api/admin/question/:questionId", Api.Question.Put);
AssociatePUTEndpoint("/api/admin/question/:questionId/option/:questionOptionId", Api.QuestionOption.Put_WithQuestionId);
// DELETEs
AssociateDELETEEndpoint("/api/admin/quiz/:quizId", Api.Quiz.Delete);
AssociateDELETEEndpoint("/api/admin/question/:questionId", Api.Question.Delete);
AssociateDELETEEndpoint("/api/admin/question/:questionId/option/:questionOptionId", Api.QuestionOption.Delete_WithQuestionId);


// MOOCchat
// AssociatePOSTEndpoint("/api/moocchat/start", undefined);
// AssociatePOSTEndpoint("/api/moocchat/fsm/transit", undefined);


// Sessions

AssociatePOSTEndpoint("/api/session/lti", Api.LoginSession.Post_Lti);

AssociateDELETEEndpoint("/api/session", Api.LoginSession.Delete);


function AssociateGETEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.get(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        const data: {[key: string]: any} = req.params;

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}

function AssociatePOSTEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.post(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        // Request body is the data we want
        // This would have been processed into a JS object via. Express
        const data = req.body || {};
        // Merge URL request params and session ID into body data
        Object.keys(req.params).forEach(key => data[key] = req.params[key]);

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}

function AssociatePUTEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.put(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        // Request body is the data we want
        // This would have been processed into a JS object via. Express
        const data = req.body || {};

        // Merge URL request params and session ID into body data
        Object.keys(req.params).forEach(key => data[key] = req.params[key]);

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}

function AssociateDELETEEndpoint<PayloadType>(url: string, endpointHandler: ApiHandlerBase<any, PayloadType>) {
    app.delete(url, (req, res) => {
        // Session ID value comes from the header
        const sessionId = req.get("Moocchat-Session-Id");

        const data: {[key: string]: any} = req.params;

        if (sessionId) {
            data["sessionId"] = sessionId;
        } else {
            delete data["sessionId"];
        }

        // Run endpoint handler, with the response request being JSON
        endpointHandler(moocchat, p => res.json(p), data);
    });
}*/