// Whole imports done due to commonjs vs es6
import stream from "stream";
import express from "express";
import multer from "multer";
import manta from "manta";
import fs from "fs";
import uniqid from "uniqid";
import path from "path";
import Config from "../config/Config";

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
            if (Config.MANTA_ENABLED) {
                this.manta = manta.createClient({
                    sign: manta.privateKeySigner({
                        key: fs.readFileSync(Config.MANTA_KEY_LOCATION, "utf-8"),
                        keyId: Config.MANTA_KEY_ID,
                        user: Config.MANTA_USER,
                        subuser: Config.MANTA_SUBUSER,
                        role: Config.MANTA_ROLES.split(',')
                    }),
                    user: Config.MANTA_USER,
                    subuser: Config.MANTA_SUBUSER,
                    url: Config.MANTA_URL,
                    role: Config.MANTA_ROLES.split(',')
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