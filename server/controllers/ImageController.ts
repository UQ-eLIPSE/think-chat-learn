import * as express from "express";
import { BaseController } from "./BaseController";
import { isAdmin } from "../js/auth/AdminPageAuth";
import * as multer from "multer";
import * as uniqid from "uniqid";
import * as path from "path";
import { Conf } from "../config/Conf";
import { MantaInterface } from "../manta/MantaInterface";
export class ImageController extends BaseController {

    private mantaInterface: MantaInterface;
    private uploadHandler: multer.Instance;
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
                    cb(null, `${tempId}.${extension}`);
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
                // Else return assign relative URL of static images path on server
                location: Conf.storage.useManta?
                    `${Conf.storage.mantaDetails.mantaLocation}/${Conf.storage.mantaDetails.mantaFolderName}/${file.filename}`
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
