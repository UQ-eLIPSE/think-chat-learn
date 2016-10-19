import * as Api from "./Api";

import { Moocchat } from "../Moocchat";

import * as IMoocchatApi from "../../../common/interfaces/IMoocchatApi";
import { Session } from "../session/Session";

/**
 * Decorates API endpoints by supplying session as the last parameter where available
 * or automatically responding with a session failure message if not
 */
export function ApplySession<Target, InputType extends IMoocchatApi.ToServerStandardRequestBase, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType) {
        // Load up session
        let session: Session;

        try {
            session = new Session(data.sessionId);
        } catch (e) {
            return res({
                success: false,
                code: "SESSION_INITIALISATION_FAILED",
                message: e.message,
            });
        }

        // Run the original method with session passed as last parameter
        originalMethod.apply(this, [moocchat, res, data, session]);
    }

    return descriptor;
}

/**
 * Decorates API endpoints by checking that the session should have access to a question
 * with given ID
 */
export function LimitQuestionIdToSession<Target, InputType extends IMoocchatApi.ToServerQuestionId, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        const questionId = data.questionId;

        if (!questionId) {
            return res({
                success: false,
                code: "MISSING_PARAMETERS",
                message: `Input missing parameters: questionId`,
            });
        }

        Api.checkQuestionId(moocchat, session, questionId, (err, result) => {
            if (Api.handleMongoError(err, res)) { return; }

            // If result blank, that means either question does not exist or
            // is not within the course requested in this session 
            if (result.length === 0) {
                return res({
                    success: false,
                    code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                    message: `Question ID "${questionId}" cannot be found or is not available for the course associated with your current session`
                });
            }

            // If question exists, then 
            originalMethod.apply(this, [moocchat, res, data, session]);
        });
    }

    return descriptor;
}

/**
 * Decorates API endpoints by checking that the session should have access to a quiz
 * with given ID
 */
export function LimitQuizIdToSession<Target, InputType extends IMoocchatApi.ToServerQuizId, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        const quizId = data.quizId;

        if (!quizId) {
            return res({
                success: false,
                code: "MISSING_PARAMETERS",
                message: `Input missing parameters: quizId`,
            });
        }

        Api.checkQuizId(moocchat, session, quizId, (err, result) => {
            if (Api.handleMongoError(err, res)) { return; }

            // If result blank, that means either quiz does not exist or
            // is not within the course requested in this session 
            if (result.length === 0) {
                return res({
                    success: false,
                    code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                    message: `Quiz ID "${quizId}" cannot be found or is not available for the course associated with your current session`
                });
            }

            // If quiz exists, then 
            originalMethod.apply(this, [moocchat, res, data, session]);
        });
    }

    return descriptor;
}

/**
 * Decorates API endpoints by checking that the session should have access to a user
 * with given ID
 */
export function LimitUserIdToSession<Target, InputType extends IMoocchatApi.ToServerUserId, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        const userId = data.userId;

        if (!userId) {
            return res({
                success: false,
                code: "MISSING_PARAMETERS",
                message: `Input missing parameters: userId`,
            });
        }

        Api.checkUserId(moocchat, session, userId, (err, result) => {
            if (Api.handleMongoError(err, res)) { return; }

            // If result blank, that means either user does not exist or
            // is not within the course requested in this session 
            if (result.length === 0) {
                return res({
                    success: false,
                    code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                    message: `User ID "${userId}" cannot be found or is not available for the course associated with your current session`
                });
            }

            // If user exists, then 
            originalMethod.apply(this, [moocchat, res, data, session]);
        });
    }

    return descriptor;
}

/**
 * Decorates API endpoints by checking that the question option is related to the question
 */
export function LimitQuestionOptionIdToQuestionId<Target, InputType extends IMoocchatApi.ToServerQuestionId & IMoocchatApi.ToServerQuestionOptionId, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        const questionId = data.questionId;
        const questionOptionId = data.questionOptionId;

        let missingParameters: string[] = [];

        !questionId && missingParameters.push("questionId");
        !questionOptionId && missingParameters.push("questionOptionId");

        if (missingParameters.length > 0) {
            return res({
                success: false,
                code: "MISSING_PARAMETERS",
                message: `Input missing parameters: ${missingParameters.join(", ")}`
            });
        }

        Api.checkQuestionOptionIdToQuestionId(moocchat, questionId, questionOptionId, (err, result) => {
            if (Api.handleMongoError(err, res)) { return; }

            // If result blank, that means either question option does not exist or
            // is not related to question ID
            if (result.length === 0) {
                return res({
                    success: false,
                    code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                    message: `Question option ID "${questionOptionId}" cannot be found or is not associated to question ID "${questionId}"`
                });
            }

            // If question option exists, then 
            originalMethod.apply(this, [moocchat, res, data, session]);
        });
    }

    return descriptor;
}
/**
 * Decorates API endpoints by checking that the session user is authorised with admin rights 
 */
export function AdminOnly<Target, InputType extends IMoocchatApi.ToServerStandardRequestBase, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Api.ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: Api.ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        if (!session.isAdmin()) {
            return res({
                success: false,
                code: "UNAUTHORISED",
                message: `Session ID "${session.getId()}" is unauthorised to access this endpoint`,
            });
        }

        originalMethod.apply(this, [moocchat, res, data, session]);
    }

    return descriptor;
}


