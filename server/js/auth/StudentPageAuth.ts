import * as express from "express";
import { LoginResponse } from "../../../common/interfaces/ToClientData";
import { UserService } from "../../services/UserService";

export class StudentAuthenticatorMiddleware {
    public userService: UserService;
    private static instance: StudentAuthenticatorMiddleware | null;

    public static checkUserId() {
        if (!StudentAuthenticatorMiddleware.instance) {
            throw Error("Middleware not instantiated");
        }

        return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
            const token = req.user as LoginResponse;
            if (token && token.user._id) {
                const maybeUser = await StudentAuthenticatorMiddleware.instance!.userService.findUser(token.user._id);
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

    public static instantiate(_userService: UserService) {
        if (!StudentAuthenticatorMiddleware.instance) {
            StudentAuthenticatorMiddleware.instance = {
                userService: _userService,
            }
        }
    }

}
