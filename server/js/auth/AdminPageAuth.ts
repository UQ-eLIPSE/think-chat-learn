import * as express from "express";
import { AdminLoginResponse } from "../../../common/interfaces/ToClientData";

// Checking for admin relies on the fact that the token cannot be changed.
// Essentially the isAdmin flag in the login response is checked and allowed to proceed
export function isAdmin() {
    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
        const token = req.user as AdminLoginResponse;

        if (token && token.isAdmin) {
            next();
        } else {
            res.status(403).send("You are unauthorised to access this content. Try logging in through Blackboard");
        }
    }
}