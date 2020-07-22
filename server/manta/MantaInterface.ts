// Whole imports done due to commonjs vs es6
import * as stream from "stream";
import * as express from "express";
import * as multer from "multer";
import * as manta from "manta";
import * as fs from "fs";
import * as uniqid from "uniqid";
import * as path from "path";
import { Conf } from "../config/Conf";

export class MantaInterface implements multer.StorageEngine {
    private static manta: manta.manta.MantaClient | null = null;

    // This determines where teh folder is to be placed in Manta
    // E.g. the combination of host + foldername forms the URL
    // I.e. https://manta_url/some_folder/file.extension
    // can be seen as ${host}/${folder}/${file}
    private foldername: string = "";

    constructor(foldername: string) {
        this.foldername = foldername;
    }

    public setFolder(foldername: string) {
        this.foldername = foldername;
    }

    public static createMantaInstance() {
        try {
            if (Conf.storage.useManta) {
                this.manta = manta.createClient({
                    sign: manta.privateKeySigner({
                        key: fs.readFileSync(Conf.storage.mantaDetails.mantaKeyLocation, "utf-8"),
                        keyId: Conf.storage.mantaDetails.mantaKeyId,
                        user: Conf.storage.mantaDetails.mantaUser,
                        subuser: Conf.storage.mantaDetails.mantaSubUser,
                        role: Conf.storage.mantaDetails.mantaRoles
                    }),
                    user: Conf.storage.mantaDetails.mantaUser,
                    subuser: Conf.storage.mantaDetails.mantaSubUser,
                    url: Conf.storage.mantaDetails.mantaLocation,
                    role: Conf.storage.mantaDetails.mantaRoles
                });
            } else {
                throw new Error("Manta interface creation not allowed");
            }
        } catch(e) {
            console.log(e);
        }
    }

    public static getMantaInstance(): manta.manta.MantaClient | null {
        return MantaInterface.manta;
    } 

    // Puts a file onto manta
    public async _handleFile(req: express.Request, file: Express.Multer.File, cb: (error: any, info?: Partial<Express.Multer.File>) => void) {
        const fileStream: stream.Readable = (file as any).stream;

        // Assign for ease of static variables checking
        const mantaInstance = MantaInterface.manta;
        if (mantaInstance) {
            const tempId = uniqid();
            const extension = path.extname(file.originalname);


            if (!extension) {
                return cb(new Error(`No extension found for incoming file ${file.originalname}`));
            }

            const destinationPath = `${this.foldername}/${tempId}${extension}`;

            try {
                await new Promise((resolve, reject) => {
                    mantaInstance.mkdirp(`${this.foldername}/`, (err: any, res: any) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(res);
                        }
                    })
                });

                // Put file
                await new Promise<any>((resolve, reject) => {
                    mantaInstance.put(
                        destinationPath,
                        fileStream,
                        {
                            // mkdirs: true,    // This flag does not work because the EAIT Manta service is returning a "ResourceNotFound" error rather than the expected "DirectoryDoesNotExistError" error.
                            headers: {
                                'access-control-allow-origin': '*',
                                'access-control-allow-methods': 'GET'
                            },
                        },
                        (err: any, res: any) => {
                            if (err) { return reject(err); }
                            return resolve(res);
                        }
                    );
                });
                return cb(null, {
                    filename: `${tempId}${extension}`,
                    fieldname: file.fieldname
                })
            } catch (e) {
                return cb(e);
            }
        } else {
            return cb(new Error("Manta not initialized"));
        }
    }

    public async _removeFile(_req: express.Request, _file: Express.Multer.File, cb: (error: any) => void) {
        // Stubbed for now
        cb(null);
    }}