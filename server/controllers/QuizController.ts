import * as express from "express";
import * as jwt from "jsonwebtoken";
import { BaseController } from "./BaseController";
import { UserService } from "../services/UserService";
import { ILTIData } from "../../common/interfaces/ILTIData";
import { Conf } from "../config/Conf";
import { QuizService } from "../services/QuizService";
import { IQuiz } from "../../common/interfaces/ToClientData";

export class QuizController extends BaseController {

    protected quizService: QuizService;

    constructor(_quizService: QuizService) {
        super();
        this.quizService = _quizService;
    }

    private createQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.createQuiz(req.body as IQuiz).then((outgoingId) => {
            if (outgoingId !== null) {
                res.json({
                    outgoingId
                });
            } else {
                console.log("A");
                res.sendStatus(400);
            }
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private updateQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.updateQuiz(req.body).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private deleteQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.deleteQuiz(req.params.questionId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e) => {
            res.sendStatus(500);
        });
    }

    private getQuizByCourse(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.getQuizzes(req.params.courseId).then((quizzes) => {
            res.json({
                quizzes
            });
        }).catch((e: Error) => {
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.put("/create", this.createQuiz.bind(this));
        this.router.post("/update", this.updateQuiz.bind(this));
        this.router.delete("/delete/:questionId", this.deleteQuiz.bind(this));
        this.router.get("/course/:courseId", this.getQuizByCourse.bind(this));
    }
}
