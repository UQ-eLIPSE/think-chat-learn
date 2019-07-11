import * as express from "express";
import { BaseController } from "./BaseController";
import { CriteriaService } from "../services/CriteriaService";
import { ICriteria } from "../../common/interfaces/DBSchema";
import { isAdmin } from "../js/auth/AdminPageAuth";
export class CriteriaController extends BaseController {

    protected criteriaService: CriteriaService;

    constructor(_criteriaService: CriteriaService) {
        super();
        this.criteriaService = _criteriaService;
    }

    private createCriteria(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.criteriaService.createOne(req.body as ICriteria).then((outgoingId) => {
            if (outgoingId !== null) {
                res.json({
                    outgoingId
                });
            } else {
                res.sendStatus(400);
            }
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private updateCriteria(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.criteriaService.updateOne(req.body as ICriteria).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private readCriteria(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.criteriaService.findOne(req.params.criteriaId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });        
    }

    private deleteCriteria(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.criteriaService.deleteOne(req.params.criteriaId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e) => {
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.post("/create", isAdmin(), this.createCriteria.bind(this));
        this.router.put("/update", isAdmin(), this.updateCriteria.bind(this));
        this.router.get("/:criteriaId", isAdmin(), this.readCriteria.bind(this));
        this.router.delete("/delete/:criteriaId", isAdmin(), this.deleteCriteria.bind(this));
    }
}
