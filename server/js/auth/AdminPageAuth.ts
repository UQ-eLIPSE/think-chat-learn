import * as express from "express";
import * as jwt from "jsonwebtoken";
import { Conf } from "../../config/Conf";

// Similar to StudentPageAuth, logins in the admin by redirecting. The actual authentication will be done upon mounted/created
export function AdminPageLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = jwt.sign(req.body as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });    
    res.redirect(Conf.adminPage + "?q=" + token);
}