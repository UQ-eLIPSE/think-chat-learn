import express from "express";
import { BaseController } from "./BaseController";
import { isAdmin } from "../js/auth/AdminPageAuth";
import multer from "multer";
import uniqid from "uniqid";
import path from "path";
import Config from "../config/Config";
import { MantaInterface } from "../manta/MantaInterface";
export class ImageController extends BaseController {

    private mantaInterface: MantaInterface;
    private uploadHandler: any;
    constructor() {
        super();
        this.mantaInterface = new MantaInterface(Config.MANTA_FOLDER_PATH);

        this.uploadHandler = multer({
            storage: Config.MANTA_ENABLED ? this.mantaInterface : 
                multer.diskStorage({
                // TODO a better destination
                destination: Config.IMAGE_UPLOAD_LOCAL_PATH,
                filename: (req: express.Request, file: any, cb: any) => {
                    const tempId = uniqid();
                    const extension = path.extname(file.originalname);
                    // Note: path.extname returns with leading dot + extension
                    cb(null, `${tempId}${extension}`);
                }
            })
        })        
    }

    private handleImageUpload(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        // The request should be intercepted by the upload handler which returns the file name
        const output: { fieldName: string, fileName: string, location: string}[] = [];

        (req.files as Express.Multer.File[]).forEach((file) => {
            output.push({
                fieldName: file.fieldname,
                fileName: file.filename,
                // Send back URL of the uploaded image
                // If manta is enabled, return absolute image URL on Manta
                // Else assign relative URL of static images path on server

                // NOTE: mantaFolderName should be configured with a leading slash in the config
                location: Config.MANTA_ENABLED?
                `${Config.MANTA_URL}${Config.MANTA_FOLDER_PATH}/${file.filename}`
                    :
                    `/images/${file.filename}`
            });
        });
        res.json(output);
        res.status(200);
    }
    public setupRoutes() {
        this.router.post("/imageUpload", isAdmin(), this.uploadHandler.any(), this.handleImageUpload.bind(this));
    }
}
