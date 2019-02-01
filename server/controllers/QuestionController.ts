import * as express from "express";
import { BaseController } from "./BaseController";
import { QuestionService } from "../services/QuestionService";
import { TypeQuestion } from "../../common/interfaces/DBSchema";
import { isAdmin } from "../js/auth/AdminPageAuth";
export class QuestionController extends BaseController {

    protected questionService: QuestionService;

    constructor(_questionService: QuestionService) {
        super();
        this.questionService = _questionService;
    }

    private createQuestion(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.questionService.createQuestion(req.body as TypeQuestion).then((outgoingId) => {
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

    private updateQuestion(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.questionService.updateQuestion(req.body as TypeQuestion).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e: Error) => {
            console.log(e);
            res.sendStatus(500);
        });
    }

    private deleteQuestion(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.questionService.deleteQuiz(req.params.questionId).then((outcome) => {
            res.json({
                outcome
            });
        }).catch((e) => {
            res.sendStatus(500);
        });
    }

    private getAllQuestions(req: express.Request, res: express.Response, next: express.NextFunction | undefined): void {
        this.questionService.getAllQuestions().then((quizzes) => {
            res.json({
                quizzes
            });
        }).catch((e: Error) => {
            res.sendStatus(500);
        });
    }

    public setupRoutes() {
        this.router.put("/create", isAdmin(), this.createQuestion.bind(this));
        this.router.post("/update", isAdmin(), this.updateQuestion.bind(this));
        this.router.delete("/delete/:questionId", isAdmin(), this.deleteQuestion.bind(this));
        this.router.get("/all", isAdmin(), this.getAllQuestions.bind(this));
    }
}
