import * as express from "express";
import { BaseController } from "./BaseController";
import { QuizService } from "../services/QuizService";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { isAdmin } from "../js/auth/AdminPageAuth";
export class QuizController extends BaseController {

    protected quizService: QuizService;

    constructor(_quizService: QuizService) {
        super();
        this.quizService = _quizService;
    }

    private createQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.createOne(req.body as IQuizOverNetwork).then((outgoingId) => {
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

    private updateQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.updateOne(req.body).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private deleteQuiz(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.quizService.deleteOne(req.params.questionId).then((outcome) => {
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
        this.router.put("/create", isAdmin(), this.createQuiz.bind(this));
        this.router.post("/update", isAdmin(), this.updateQuiz.bind(this));
        this.router.delete("/delete/:questionId", isAdmin(), this.deleteQuiz.bind(this));
        this.router.get("/course/:courseId", isAdmin(), this.getQuizByCourse.bind(this));
    }
}
