import express from "express";
import { BaseController } from "./BaseController";
import { isAdmin } from "../js/auth/AdminPageAuth";
import multer from "multer";
import uniqid from "uniqid";
import path from "path";
import { Conf } from "../config/Conf";
import { MantaInterface } from "../manta/MantaInterface";
export class ImageController extends BaseController {

    private mantaInterface: MantaInterface;
    // TODO: Try to fix type of uploadHandler
    private uploadHandler: any;
    constructor() {
        super();
        this.mantaInterface = new MantaInterface(Conf.storage.mantaDetails.mantaFolderName);

        this.uploadHandler = multer({
            storage: Conf.storage.useManta ? this.mantaInterface : 
                multer.diskStorage({
                // TODO a better destination
                destination: Conf.storage.internalLocation,
                filename: (req: express.Request, file: any, cb: any) => {
                    const tempId = uniqid();
                    const extension = path.extname(file.originalname);
                    cb(null, `${tempId}${extension}`);
                }
            })
        })        
    }

    private handleImageUpload(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        // The request should be intercepted by the upload handler which returns the file name
        const output: { fieldName: string, fileName: string}[] = [];

        (req.files as Express.Multer.File[]).forEach((file) => {
            output.push({
                fieldName: file.fieldname,
                fileName: file.filename
            })
        });
        res.json(output);
        res.status(200);
    }
    public setupRoutes() {
        this.router.post("/imageUpload", isAdmin(), this.uploadHandler.any(), this.handleImageUpload.bind(this));
    }
}
