const mongodb = require("mongodb");
const pg = require("pg");
const crypto = require("crypto");

const Database = require("../../build/server/js/data/Database").Database;

const User = require("../../build/server/js/data/models/User").User;
const UserSession = require("../../build/server/js/data/models/UserSession").UserSession;

const Question = require("../../build/server/js/data/models/Question").Question;
const QuestionOption = require("../../build/server/js/data/models/QuestionOption").QuestionOption;
const QuestionResponse = require("../../build/server/js/data/models/QuestionResponse").QuestionResponse;

const QuizAttempt = require("../../build/server/js/data/models/QuizAttempt").QuizAttempt;
const QuizSchedule = require("../../build/server/js/data/models/QuizSchedule").QuizSchedule;

const ChatGroup = require("../../build/server/js/data/models/ChatGroup").ChatGroup;
const ChatMessage = require("../../build/server/js/data/models/ChatMessage").ChatMessage;

const Survey = require("../../build/server/js/data/models/Survey").Survey;
const SurveyResponse = require("../../build/server/js/data/models/SurveyResponse").SurveyResponse;

const Mark = require("../../build/server/js/data/models/Mark").Mark;

// =============================================================================
// MOOCchat
// MongoDB to PostgreSQL utility
// =============================================================================
//
// *** WARNING: This will wipe the destination database! ***
//
// The source MongoDB and destination PostgreSQL database are assumed to be 
// whatever the below values are configured as.
// 
// To execute, run `npm run m2p`.

const config = {
    mongodb: {
        uri: "mongodb://localhost:27017/moocchatDB"
    },
    postgresql: {
        host: "localhost",
        port: 5432,
        database: "moocchatDB",
        user: "postgres",
        password: "password"
    }
};



// =============================================================================

// Set up postgres client
const pgPool = new pg.Pool(config.postgresql);
var mongoDb;

connectMongo()                      // Connect to mongo
    .then(x => mongoDb = x)         // Assign mongo db reference

    .then(pgPool.connect())         // Connect to postgres
    .then(initPostgresDb())         // Initialise postgres DB

    // ===== Start insertions =====

    .then(() => {
        console.log("Stage 1");
        return Promise.all([
            insertUsers(),
            insertQuestions(),
            insertSurveys()
        ]);
    })

    .then(() => {
        console.log("Stage 2");
        return Promise.all([
            insertUserSessions(),
            insertQuizSchedules(),
            insertQuestionOptions()
        ]);
    })

    .then(() => {
        console.log("Stage 3");
        return Promise.all([
            insertQuestionResponses()
        ]);
    })

    .then(() => {
        console.log("Stage 4");
        return Promise.all([
            insertQuizAttempts()
        ]);
    })

    .then(() => {
        console.log("Stage 5");
        return Promise.all([
            insertChatGroups(),
            insertSurveyResponses(),
            insertMarks()
        ]);
    })

    .then(() => {
        console.log("Stage 6");
        return Promise.all([
            insertChatMessages()
        ]);
    })

    // ===== End insertions =====

    .then(pgPool.end())             // Close postgres connection
    .then(disconnectMongo())        // Close mongo connection

    .then(() => console.log("All done"))

    .catch((err) => {
        console.error(err.message);
    });

// =============================================================================

function connectMongo() {
    return Database.Connect(config.mongodb.uri);
}

function disconnectMongo() {
    return Database.Close(mongoDb);
}

function initPostgresDb() {
    const query = `

DROP TABLE IF EXISTS "uq_surveyResponse";
DROP TABLE IF EXISTS "uq_survey";

DROP TABLE IF EXISTS "uq_chatMessage";

DROP TABLE IF EXISTS "uq_userSession";

DROP TABLE IF EXISTS "uq_questionResponse";

DROP TABLE IF EXISTS "uq_quizSchedule";
DROP TABLE IF EXISTS "uq_questionOption";

DROP TABLE IF EXISTS uq_question;
DROP TABLE IF EXISTS uq_user;

------------------------------------------ Table: uq_question

CREATE TABLE uq_question
(
    id character(24) NOT NULL,
    title text,
    content text,
    course character varying(32) NOT NULL,
    CONSTRAINT "uq_question_id" PRIMARY KEY (id)
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_user

CREATE TABLE uq_user
(
    id character(24) NOT NULL,
    username character varying(32) NOT NULL,
    "firstName" character varying(128) NOT NULL,
    "lastName" character varying(128) NOT NULL,
    "researchConsent" boolean,
    CONSTRAINT "uq_user_id" PRIMARY KEY (id)
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_quizSchedule

CREATE TABLE "uq_quizSchedule"
(
    id character(24) NOT NULL,
    "questionId" character(24) NOT NULL,
    course character varying(32) NOT NULL,
    "availableStart" timestamp with time zone NOT NULL,
    "availableEnd" timestamp with time zone NOT NULL,
    CONSTRAINT "uq_quizSchedule_id" PRIMARY KEY (id),
    CONSTRAINT "uq_quizSchedule_questionId_fkey" FOREIGN KEY ("questionId")
        REFERENCES uq_question (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_questionOption

CREATE TABLE "uq_questionOption"
(
    id character(24) NOT NULL,
    "questionId" character(24) NOT NULL,
    sequence integer NOT NULL,
    content text,
    CONSTRAINT "uq_questionOption_id" PRIMARY KEY (id),
    CONSTRAINT "uq_questionOption_questionId_fkey" FOREIGN KEY ("questionId")
        REFERENCES uq_question (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_questionResponse

CREATE TABLE "uq_questionResponse"
(
    id character(24) NOT NULL,
    "optionId" character(24),
    justification text,
    "timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "uq_questionResponse_id" PRIMARY KEY (id),
    CONSTRAINT "uq_questionResponse_optionId_fkey" FOREIGN KEY ("optionId")
        REFERENCES "uq_questionOption" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_userSession

CREATE TABLE "uq_userSession"
(
    id character(24) NOT NULL,
    "userId" character(24) NOT NULL,
    "timestampStart" timestamp with time zone NOT NULL,
    "timestampEnd" timestamp with time zone,
    type character varying(8) NOT NULL,
    course character varying(32) NOT NULL,
    CONSTRAINT "uq_userSession_id" PRIMARY KEY (id),
    CONSTRAINT "uq_userSession_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "uq_user" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_quizAttempt

CREATE TABLE "uq_quizAttempt"
(
    id character(24) NOT NULL,
    "userSessionId" character(24) NOT NULL,
    "quizScheduleId" character(24) NOT NULL,
    "responseInitialId" character(24),
    "responseFinalId" character(24),
    CONSTRAINT "uq_quizAttempt_id" PRIMARY KEY (id),
    CONSTRAINT "uq_quizAttempt_userSessionId_fkey" FOREIGN KEY ("userSessionId")
        REFERENCES "uq_userSession" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_quizAttempt_quizScheduleId_fkey" FOREIGN KEY ("quizScheduleId")
        REFERENCES "uq_quizSchedule" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_quizAttempt_responseInitialId_fkey" FOREIGN KEY ("responseInitialId")
        REFERENCES "uq_questionResponse" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_quizAttempt_responseFinalId_fkey" FOREIGN KEY ("responseFinalId")
        REFERENCES "uq_questionResponse" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_chatGroup

CREATE TABLE "uq_chatGroup"
(
    id character(24) NOT NULL,
    "quizAttemptIds" character(24)[] NOT NULL,
    "quizScheduleId" character(24) NOT NULL,
    CONSTRAINT "uq_chatGroup_id" PRIMARY KEY (id),
    CONSTRAINT "uq_chatGroup_quizScheduleId_fkey" FOREIGN KEY ("quizScheduleId")
        REFERENCES "uq_quizSchedule" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_chatMessage

CREATE TABLE "uq_chatMessage"
(
    id character(24) NOT NULL,
    "quizAttemptId" character(24) NOT NULL,
    "chatGroupId" character(24) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    content text,
    CONSTRAINT "uq_chatMessage_id" PRIMARY KEY (id),
    CONSTRAINT "uq_chatMessage_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId")
        REFERENCES "uq_quizAttempt" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_chatMessage_chatGroupId_fkey" FOREIGN KEY ("chatGroupId")
        REFERENCES "uq_chatGroup" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_survey

CREATE TABLE "uq_survey"
(
    id character(24) NOT NULL,
    "availableStart" timestamp with time zone NOT NULL,
    content jsonb,
    course character varying(32) NOT NULL,    
    CONSTRAINT "uq_survey_id" PRIMARY KEY (id)
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_surveyResponse

CREATE TABLE "uq_surveyResponse"
(
    id character(24) NOT NULL,
    "quizAttemptId" character(24) NOT NULL,
    "surveyId" character(24) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    content jsonb NOT NULL,
    CONSTRAINT "uq_surveyResponse_id" PRIMARY KEY (id),
    CONSTRAINT "uq_surveyResponse_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId")
        REFERENCES "uq_quizAttempt" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_surveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId")
        REFERENCES uq_survey (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);

------------------------------------------ Table: uq_mark

CREATE TABLE "uq_mark"
(
    id character(24) NOT NULL,
    "markerUserSessionId" character(24) NOT NULL,
    "quizAttemptId" character(24) NOT NULL,
    value smallint NOT NULL,
    method character varying(8) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "invalidated" timestamp with time zone,
    CONSTRAINT "uq_mark_id" PRIMARY KEY (id),
    CONSTRAINT "uq_mark_markerUserSessionId_fkey" FOREIGN KEY ("markerUserSessionId")
        REFERENCES "uq_userSession" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "uq_mark_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId")
        REFERENCES "uq_quizAttempt" (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS=FALSE
);
`;

    return pgPool.query(query);
}

/**
 * 
 * @param {string} typeString Short text for what you're inserting
 * @param {Function} modelClass Class to load up the model via.
 * @param {Function} mapFunction (document, i) => { query: string, values: any[] }
 */
function insertionFactory(typeString, modelClass, mapFunction) {
    return function() {
        console.log(`Inserting ${typeString}...`);

        return pgPool.query("BEGIN")

            // Read in collection
            .then(new Promise((resolve, reject) => {
                new modelClass(db).readAsArray({}, (err, docs) => {
                    if (err) { return reject(err); }
                    resolve(docs);
                });
            }))

            // Go through all documents and do insertion queries
            .then((docs) => {
                return Promise.all(
                    docs.map((doc, i) => {
                        const queryParams = mapFunction(doc, i);
                        return pgPool.query(queryParams.query, queryParams.values);
                    })
                );
            })

            // Commit once all insertion queries done
            .then(pgPool.query("COMMIT"));
    };
}

const insertUsers = insertionFactory("users", User, (user) => {
    /** @type {boolean | null} */
    let researchConsent = user.researchConsent;

    if (!(researchConsent === true || researchConsent === false)) {
        researchConsent = null;
    }

    return {
        query: `INSERT INTO uq_user ("id", "username", "firstName", "lastName", "researchConsent") VALUES ($1, $2, $3, $4, $5)`,
        values: [user._id.toHexString(), user.username, user.firstName, user.lastName, user.researchConsent]
    };
});

const insertQuestions = insertionFactory("questions", Question, (question) => {
    return {
        query: `INSERT INTO uq_question ("id", "title", "content", "course") VALUES ($1, $2, $3, $4)`,
        values: [question._id.toHexString(), question.title, question.content, question.course]
    };
});

const insertQuizSchedules = insertionFactory("quiz schedules", QuizSchedule, (quizSchedule) => {
    return {
        query: `INSERT INTO "uq_quizSchedule" ("id", "questionId", "course", "availableStart", "availableEnd") VALUES ($1, $2, $3, $4, $5)`,
        values: [quizSchedule._id.toHexString(), quizSchedule.questionId.toHexString(), quizSchedule.course, quizSchedule.availableStart.toISOString(), quizSchedule.availableEnd.toISOString()]
    };
});

const insertQuizAttempts = insertionFactory("quiz attempts", QuizAttempt, (quizAttempt) => {
    /** @type {string | null} */
    let responseInitialId;
    /** @type {string | null} */
    let responseFinalId;

    if (quizAttempt.responseInitialId) {
        responseInitialId = quizAttempt.responseInitialId.toHexString();
    } else {
        responseInitialId = null;
    }

    if (quizAttempt.responseFinalId) {
        responseFinalId = quizAttempt.responseFinalId.toHexString();
    } else {
        responseFinalId = null;
    }

    return {
        query: `INSERT INTO "uq_chatGroup" ("id", "userSessionId", "quizScheduleId", "responseInitialId", "responseFinalId") VALUES ($1, $2, $3, $4, $5)`,
        values: [
            quizAttempt._id.toHexString(),
            quizAttempt.userSessionId.toHexString(),
            quizAttempt.quizScheduleId.toHexString(),
            responseInitialId,
            responseFinalId
        ]
    };
});

const insertQuestionOptions = insertionFactory("question options", QuestionOption, (questionOption) => {
    return {
        query: `INSERT INTO "uq_questionOption" ("id", "questionId", "sequence", "content") VALUES ($1, $2, $3, $4)`,
        values: [questionOption._id.toHexString(), questionOption.questionId.toHexString(), questionOption.sequence, questionOption.content]
    };
});

const insertQuestionResponses = insertionFactory("question responses", QuestionResponse, (questionResponse) => {
    /** @type {string | null} */
    let respOptionId;

    if (questionResponse.optionId) {
        respOptionId = questionResponse.optionId.toHexString();
    } else {
        respOptionId = null;
    }

    return {
        query: `INSERT INTO "uq_questionResponse" ("id", "optionId", "justification", "timestamp") VALUES ($1, $2, $3, $4)`,
        values: [questionResponse._id.toHexString(), respOptionId, questionResponse.justification, questionResponse.timestamp.toISOString()]
    };
});

const insertUserSessions = insertionFactory("user sessions", UserSession, (userSession, i) => {
    /** @type {string | null} */
    let responseInitialId;
    /** @type {string | null} */
    let responseFinalId;

    /** @type {string | null} */
    let timestampEnd;

    if (userSession.responseInitialId) {
        responseInitialId = userSession.responseInitialId.toHexString();
    } else {
        responseInitialId = null;
    }

    if (userSession.responseFinalId) {
        responseFinalId = userSession.responseFinalId.toHexString();
    } else {
        responseFinalId = null;
    }

    if (userSession.timestampEnd) {
        timestampEnd = userSession.timestampEnd.toISOString();
    } else {
        timestampEnd = null;
    }

    return {
        query: `INSERT INTO "uq_userSession" ("id", "userId", "timestampStart", "timestampEnd", "type", "course") VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [userSession._id.toHexString(), userSession.userId.toHexString(), userSession.timestampStart.toISOString(), timestampEnd, userSession.type, userSession.course]
    };
});

const insertSurveys = insertionFactory("surveys", Survey, (survey) => {
    return {
        query: `INSERT INTO "uq_survey" ("id", "availableStart", "content", "course") VALUES ($1, $2, $3, $4)`,
        values: [survey._id.toHexString(), survey.availableStart.toISOString(), JSON.stringify(survey.content), survey.course]
    };
});

const insertChatGroups = insertionFactory("chat groups", ChatGroup, (chatGroup) => {
    // Map out quiz attempt IDs
    const quizAttemptIds = chatMessage.quizAttemptIds.map(x => x.toHexString());

    return {
        query: `INSERT INTO "uq_chatGroup" ("id", "quizAttemptIds", "quizScheduleId") VALUES ($1, $2, $3)`,
        values: [chatMessage._id.toHexString(), quizAttemptIds, chatMessage.quizScheduleId.toHexString()]
    };
});

const insertChatMessages = insertionFactory("chat messages", ChatMessage, (chatMessage) => {
    return {
        query: `INSERT INTO "uq_chatMessage" ("id", "quizAttemptId", "chatGroupId", "timestamp", "content") VALUES ($1, $2, $3, $4, $5)`,
        values: [chatMessage._id.toHexString(), chatMessage.quizAttemptId.toHexString(), chatMessage.chatGroupId.toHexString(), chatMessage.timestamp.toISOString(), chatMessage.content]
    };
});

const insertSurveyResponses = insertionFactory("survey responses", SurveyResponse, (surveyResponse) => {
    return {
        query: `INSERT INTO "uq_surveyResponse" ("id", "quizAttemptId", "surveyId", "timestamp", "content") VALUES ($1, $2, $3, $4, $5)`,
        values: [
            surveyResponse._id.toHexString(),
            surveyResponse.quizAttemptId.toHexString(),
            surveyResponse.surveyId.toHexString(),
            surveyResponse.timestamp.toISOString(),
            JSON.stringify(surveyResponse.content)
        ]
    };
});

const insertMarks = insertionFactory("marks", Mark, (mark) => {
    /** @type {string | null} */
    let invalidatedTime;

    if (surveyResponse.invalidated) {
        invalidatedTime = surveyResponse.invalidated.toISOString();
    } else {
        invalidatedTime = null;
    }

    return {
        query: `INSERT INTO "uq_mark" ("id", "markerUserSessionId", "quizAttemptId", "value", "method", "timestamp", "invalidated") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        values: [
            surveyResponse._id.toHexString(),
            surveyResponse.markerUserSessionId.toHexString(),
            surveyResponse.quizAttemptId.toHexString(),
            surveyResponse.value,
            surveyResponse.method,
            surveyResponse.timestamp.toISOString(),
            invalidatedTime
        ]
    };
});
