import * as express from "express";
import { LoginResponse, IUserSession, IQuizSession, Response } from "../../../common/interfaces/ToClientData";
import { UserService } from "../../services/UserService";
import { UserSessionService } from "../../services/UserSessionService";
import { QuizSessionService } from "../../services/QuizSessionService";
import { ResponseService } from "../../services/ResponseService";

export class StudentAuthenticatorMiddleware {
    public userService: UserService;
    public userSessionService: UserSessionService;
    public quizSessionService: QuizSessionService;
    public responseService: ResponseService;

    private static instance: StudentAuthenticatorMiddleware | null;

    public static checkUserId() {
        if (!StudentAuthenticatorMiddleware.instance) {
            throw Error("Middleware not instantiated");
        }

        return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
            const token = req.user as LoginResponse;
            if (token && token.user._id) {
                const maybeUser = await StudentAuthenticatorMiddleware.instance!.userService.findOne(token.user._id);
                if (maybeUser) {
                    next();
                } else {
                    res.status(403).send("Invalid credentials. Try logging in through Blackboard again");
                }
            } else {
                res.status(403).send("You are unauthorised to access this content. Try logging in through Blackboard");
            }
        }
    }

    public static checkUserSessionId() {
        if (!StudentAuthenticatorMiddleware.instance) {
            throw Error("Middleware not instantiated");
        }

        return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
            const token = req.user as LoginResponse;
            const body = req.body as IUserSession;

            if (token && token.user._id && body.userId && body._id) {
                const maybeUser = await StudentAuthenticatorMiddleware.instance!.userService.findOne(token.user._id);
                const maybeUsersession = await StudentAuthenticatorMiddleware.instance!.userSessionService.findOne(body._id);

                if (maybeUser && maybeUsersession && maybeUsersession.userId === maybeUser._id) {
                    next();
                } else {
                    res.status(403).send("Invalid user session. Try logging in through Blackboard again");
                }
            } else {
                res.status(403).send("You are unauthorised to access this content. Try logging in through Blackboard");
            }
        }
    }

    public static checkQuizSessionId() {
        if (!StudentAuthenticatorMiddleware.instance) {
            throw Error("Middleware not instantiated");
        }

        return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
            const token = req.user as LoginResponse;
            const body = req.body as IQuizSession;

            if (token && token.user._id && body && body.userSessionId) {
                const maybeUser = await StudentAuthenticatorMiddleware.instance!.userService.findOne(token.user._id);
                const maybeUsersession = await StudentAuthenticatorMiddleware.instance!.userSessionService.findOne(body.userSessionId);

                let maybeQuizSession;
                let otherUserSession;
                if (body._id) {
                    maybeQuizSession = await StudentAuthenticatorMiddleware.instance!.quizSessionService.findOne(body._id);

                    if (maybeQuizSession && maybeQuizSession.userSessionId) {
                        otherUserSession = await StudentAuthenticatorMiddleware.instance!.userSessionService.findOne(maybeQuizSession!.userSessionId!);
                    }

                }

                if (maybeUser && maybeUsersession && maybeUsersession.userId === maybeUser._id &&
                    ((!maybeQuizSession && !body._id) || (maybeQuizSession && otherUserSession &&
                    otherUserSession.userId === maybeUsersession.userId))) {
                    next();
                } else {
                    res.status(403).send("Invalid user session. Try logging in through Blackboard again");
                }
            } else {
                res.status(403).send("You are unauthorised to access this content. Try logging in through Blackboard");
            }
        }
    }

    public static checkResponseBody() {
        if (!StudentAuthenticatorMiddleware.instance) {
            throw Error("Middleware not instantiated");
        }

        return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
            const token = req.user as LoginResponse;
            const body = req.body as Response;

            if (token && token.user._id && body && body.quizSessionId) {
                const maybeUser = await StudentAuthenticatorMiddleware.instance!.userService.findOne(token.user._id);
                const maybeQuizSession = await StudentAuthenticatorMiddleware.instance!.quizSessionService.findOne(body.quizSessionId);

                let maybeUsersession;

                if (maybeQuizSession && maybeQuizSession.userSessionId) {
                    maybeUsersession = await StudentAuthenticatorMiddleware.instance!.userSessionService.findOne(maybeQuizSession.userSessionId);
                }

                let maybeResponse;

                if (body._id) {
                    maybeResponse = await StudentAuthenticatorMiddleware.instance!.responseService.findOne(body._id);
                }

                if (maybeUser && maybeUsersession && maybeQuizSession && maybeUsersession.userId === maybeUser._id &&
                    ((!maybeResponse && !body._id) || (maybeResponse && maybeResponse.quizSessionId === maybeQuizSession._id))) {
                    next();
                } else {
                    res.status(403).send("Invalid user session. Try logging in through Blackboard again");
                }
            } else {
                res.status(403).send("You are unauthorised to access this content. Try logging in through Blackboard");
            }
        }
    }    

    public static instantiate(_userService: UserService, _userSessionService: UserSessionService, _quizSessionService: QuizSessionService,
            _responseService: ResponseService) {
        if (!StudentAuthenticatorMiddleware.instance) {
            StudentAuthenticatorMiddleware.instance = {
                userService: _userService,
                userSessionService: _userSessionService,
                quizSessionService: _quizSessionService,
                responseService: _responseService
            }
        }
    }

}
