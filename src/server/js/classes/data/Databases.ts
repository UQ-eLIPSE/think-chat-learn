/**
 * Handles all writing and reading to the database
 * @author eLIPSE
 */
import * as mongojs from "mongojs";

import {tables} from "../../classes/data/Tables";

import {Question} from "../../models/database/Question";
import {QuestionOption} from "../../models/database/QuestionOption";
import {QuestionOptionCorrect} from "../../models/database/QuestionOptionCorrect";
import {QuestionResponse} from "../../models/database/QuestionResponse";
import {QuizSchedule} from "../../models/database/QuizSchedule";
import {ChatMessage} from "../../models/database/ChatMessage";
import {User} from "../../models/database/User";
import {UserSession} from "../../models/database/UserSession";
import {Survey} from "../../models/database/Survey";
import {SurveyResponse} from "../../models/database/SurveyResponse";
import {VirtServerBackups} from "../../models/database/VirtServerBackups";

import {ServerConf} from "../conf/ServerConf";

var collections: string[] = [];

for (var key in tables) {
	// TODO: Fix `any` type workaround
	collections.push((<{[key: string]: string}><any>tables)[key]);
}

// Set to an object
var db = mongojs(ServerConf.database, collections);

export const Databases = {
	database: db,

	// ORM objects
	question: new Question(db),
	questionOption: new QuestionOption(db),
	questionOptionCorrect: new QuestionOptionCorrect(db),
	questionResponse: new QuestionResponse(db),

	quizSchedule: new QuizSchedule(db),

	chatMessage: new ChatMessage(db),

	user: new User(db),
	userSession: new UserSession(db),

	survey: new Survey(db),
	surveyResponse: new SurveyResponse(db),

	virtServerBackups: new VirtServerBackups(db)
};
