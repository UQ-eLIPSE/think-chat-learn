import { Db, MongoClient } from "mongodb";
import { Conf } from "../config/Conf";
import { Query } from "./query";
import * as fs from "fs";

// Controllers
import { UserRepository } from "../repositories/UserRepository";
import { QuizRepository } from "../repositories/QuizRepository";
import { UserSessionRepository } from "../repositories/UserSessionRepository";
import { QuizSessionRepository } from "../repositories/QuizSessionRepository";
import { ResponseRepository } from "../repositories/ResponseRepository";

// Services
import { UserSessionService } from "../services/UserSessionService";
import { QuizSessionService } from "../services/QuizSessionService";
import { ResponseService } from "../services/ResponseService";

// Interfaces
import { Response, IResponseQualitative } from "../../common/interfaces/DBSchema";
import { QuestionRepository } from "../repositories/QuestionRepository";
import { QuestionService } from "../services/QuestionService";
import { IQuestion } from "../../common/interfaces/ToClientData";


const FIXED_HEADERS = ["Username", "Last Name", "First Name"];
const QUESTION_HEADERS = ["Question ID", "Question", "Answer", "Possible Points", "Auto Score", "Manual Score"];
const BLANK_FIELDS = 2;
class ExtractQuestions {
    private static async connectDb() {
        const connection = await MongoClient.connect(Conf.database, { useNewUrlParser: true });
        const db = await connection.db();
        return db;
    }

    public static async runQuery() {
        const db = await ExtractQuestions.connectDb();
        const userRepository = new UserRepository(db, "uq_user");
        const quizRepository = new QuizRepository(db, "uq_quizSchedule");
        const userSessionRepository = new UserSessionRepository(db, "uq_userSession");
        const quizSessionRepository = new QuizSessionRepository(db, "uq_quizSession");
        const responseRepository = new ResponseRepository(db, "uq_responses");
        const questionRepository = new QuestionRepository(db, "uq_question");

        const userSessionService = new UserSessionService(userSessionRepository);
        const quizSessionService = new QuizSessionService(quizSessionRepository, userSessionRepository,
            quizRepository, responseRepository, questionRepository, userRepository);
        const responseService = new ResponseService(responseRepository, quizSessionRepository, quizRepository);
        const questionService = new QuestionService(questionRepository);

        // Grab every single response for each question
        const responsePromises: Promise<Response[]>[] = [];
        
        for (let i = 0 ; i < Query.questionIds.length; i++) {
            const questionId = Query.questionIds[i];
            responsePromises.push(responseService.getResponses(Query.quizId, questionId));
        }

        // Store in a single array
        const responses = await Promise.all(responsePromises).then((arrs) => {
            let output: Response[] = [];
            for (let i = 0 ; i < arrs.length; i++) {
                output = output.concat(arrs[i]);
            }
            return output;
        });

        // Link a response to a user
        const quizSessions = await quizSessionService.getQuizSessions(Query.quizId);
        if (!quizSessions) {
            throw new Error(`No quiz session based on ${Query.quizId}`);
        }

        const userSessions = (await userSessionService.getUserSessions(Query.course)).filter((userSession) => {
            // Filter all user sessions that are present in the quiz
            return quizSessions.find((quizSession) => {
                return quizSession.userSessionId === userSession._id;
            });
        });

        // Key in this case is the user id and question ids for each response
        const userQuizDict: {[userId: string] : {[questionId: string]: string}} = {};

        const allUsers = await userRepository.findByIdArray(
            userSessions.reduce((arr, userSession) => {
                arr.push(userSession.userId!);
                return arr;
            }, [] as string[])
        );

        // Map the userids to quiz sessions, if there are multiple instances of quiz attempts (shouldn't be)
        // then override
        const questionSet = new Set<string>();
        for (let i = 0 ; i < allUsers.length; i++) {
            const user = allUsers[i];
            const userSession = userSessions.find((userSession) => {
                return userSession.userId === user._id;
            })!;

            const quizSession = quizSessions.find((quizSession) => {
                return quizSession.userSessionId === userSession._id;
            })!;

            const response = responses.filter((resp) => {
                return resp.quizSessionId === quizSession._id;
            });

            // Assume qualitative for now
            userQuizDict[user._id!] = {};
            
            response.forEach((resp) => {
                // Remember to strip all tabs. Will replace with spaces
                userQuizDict[user._id!][resp.questionId!] = (resp as IResponseQualitative).content.replace(/\t+/g, "").replace(/\n+/g, " ");
                questionSet.add(resp.questionId!);
            });
        }

        // From the question set create the tsv. Convert the set to array to maintain order
        const questionIdArr = Array.from(questionSet.keys());
        // Fetch the questions to
        const questionContent = (await questionRepository.findByIdArray(questionIdArr)).reduce((dict, question) => {
            dict[question._id!] = question.content!;
            return dict;
        }, {} as {[key: string]: string});

        // Building the string
        let stringy = "";

        // Create the first line as it contains the headers
        for (let i = 0 ; i < FIXED_HEADERS.length; i++) {
            stringy = stringy +  FIXED_HEADERS[i] + "\t";
        }

        for (let i = 0 ; i < questionIdArr.length; i++) {
            for (let j = 0; j < QUESTION_HEADERS.length; j++) {
                stringy = stringy + QUESTION_HEADERS[j] + " "  + (i + 1) + (((j === QUESTION_HEADERS.length - 1) && (i === questionIdArr.length - 1)) ? "\n" : "\t");
            }
        }

        // Iterate through user answers, keeping note of indices
        for (let i = 0 ; i < allUsers.length; i++) {
            const user = allUsers[i];

            // Fixed headers
            for (let j = 0; j < FIXED_HEADERS.length; j++) {
                switch (j) {
                    case 0:
                        stringy = stringy + user.username!;
                        break;
                    case 1:
                        stringy = stringy + user.lastName!;
                        break;
                    case 2:
                        stringy = stringy + user.firstName!;
                        break;
                }
                stringy = stringy + "\t";
            }

            // Question headers. Note it is based on the user question id
            for (let j = 0; j < questionIdArr.length; j++) {
                // Hard code the qustion id
                stringy = stringy + QUESTION_HEADERS[0] + (j + 1) + "\t";

                stringy = stringy + questionContent[questionIdArr[j]] + "\t";

                // Fetch the answer
                if ((userQuizDict[user._id!][questionIdArr[j]] && (userQuizDict[user._id!][questionIdArr[j]] !== ""))) {
                    stringy = stringy + userQuizDict[user._id!][questionIdArr[j]] + "\t";
                } else {
                    stringy = stringy + "BLANK\t";
                }

                // Add score
                stringy = stringy + "10\t";

                // Add empty tabs
                stringy = stringy + "\t".repeat(BLANK_FIELDS);

                if (j === questionIdArr.length - 1) {
                    stringy = stringy + "\n";
                }
            }
        }

        fs.writeFile("./output.tsv", stringy, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("DONE");
            }
        });

        return;
    }

}

ExtractQuestions.runQuery();