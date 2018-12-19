import * as express from "express";
import * as jwt from "jsonwebtoken";
import { Conf } from "../../config/Conf";
import { FrontEndUser } from "../../../common/interfaces/User";

// Similar to StudentPageAuth, logins in the admin by redirecting. The actual authentication will be done upon mounted/created
export function AdminPageLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
    // TODO determine the difference between user and student interface, currently recycled

    // Note that req.body is the LTI body
    const output: FrontEndUser = {
        id: req.body.user_id,
        firstname: req.body.lis_person_name_given,
        surname: req.body.lis_person_name_family,
        // Id is supposed to be the DB entry but is currently student name for now...
        username: req.body.user_id,
        // Default to false fr now..
        researchConsent: false
    }


    const token = jwt.sign(output as Object, Conf.jwt.SECRET, { expiresIn: Conf.jwt.TOKEN_LIFESPAN });    
    res.redirect(Conf.adminPage + "?q=" + token);
}