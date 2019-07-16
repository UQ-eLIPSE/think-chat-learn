import * as express from "express";
import { BaseController } from "./BaseController";
import { IRubric } from "../../common/interfaces/DBSchema";
import { isAdmin } from "../js/auth/AdminPageAuth";
import { RubricService } from "../services/RubricService";
export class RubricController extends BaseController {

    protected rubricService: RubricService;

    constructor(_rubricService: RubricService) {
        super();
        this.rubricService = _rubricService;
    }

    private createRubric(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.rubricService.createOne(req.body as IRubric).then((outgoingId) => {
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

    private updateRubric(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.rubricService.updateOne(req.body as IRubric).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private readRubric(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.rubricService.findOne(req.params.criteriaId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });        
    }

    private deleteRubric(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.rubricService.deleteOne(req.params.criteriaId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e) => {
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.put("/create", isAdmin(), this.createRubric.bind(this));
        this.router.post("/update", isAdmin(), this.updateRubric.bind(this));
        this.router.get("/:criteriaId", isAdmin(), this.readRubric.bind(this));
        this.router.delete("/delete/:criteriaId", isAdmin(), this.deleteRubric.bind(this));
    }
}
