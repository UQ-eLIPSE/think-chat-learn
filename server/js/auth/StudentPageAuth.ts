import * as express from "express";
import * as jwt from "jsonwebtoken";
import { Conf } from "../../config/Conf";

// Handles the initial login and redirects the student to the login page
export function StudentPageLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = jwt.sign(req.body as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });
    res.redirect(Conf.clientPage + "?q=" + token);
}