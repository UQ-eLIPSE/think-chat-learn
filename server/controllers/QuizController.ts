import express from "express";
import { BaseController } from "./BaseController";
import { QuizService } from "../services/QuizService";
import { IQuizOverNetwork } from "../../common/interfaces/NetworkData";
import { isAdmin } from "../js/auth/AdminPageAuth";
import { LoginResponse } from "../../common/interfaces/ToClientData";
import { StudentAuthenticatorMiddleware } from "../js/auth/StudentPageAuth";
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

    /**
     * Updates quiz marks visibility i.e. whether marks for a quiz schedule are available to students
     * @param req 
     * @param res 
     */
    private async updateQuizMarksVisibility(req: express.Request, res: express.Response) {
        try {
            const { marksPublic, quizScheduleId } = req.body;
            if (marksPublic === undefined || quizScheduleId === undefined || typeof quizScheduleId !== "string") {
                throw new Error("Invalid parameters supplied for updating marks visiblity");
            }
            
            const result = await this.quizService.updateQuizMarksVisibility(quizScheduleId, marksPublic);

            if(!result) throw new Error();

            return res.json({
                success: true
            }).status(200);
        } catch (e) {
            console.error('Quiz marks visibility update error:', e);
            return res.json({
                success: false
            }).status(500);
        }
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

    /**
     * Returns active quizzes with limited content
     * @param req 
     * @param res 
     * @param next 
     */
    private async getActiveQuizWithoutContentByCourse(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        try {
            const decodedToken = req.user as LoginResponse;
            const courseCode = decodedToken.courseId;

            // Check if custom quiz id was passed
            const customQuizId = decodedToken.customQuizId;
            if (!courseCode || !decodedToken || !decodedToken.user || !decodedToken.user._id) return res.sendStatus(500);

            const quizzes = await this.quizService.getActiveOrUpcomingQuizzesWithoutContent(courseCode, 'active', decodedToken.isAdmin);

            if (!quizzes) return res.sendStatus(500);

            const filteredQuizzes = customQuizId? quizzes.filter((quiz) => quiz._id === customQuizId) : quizzes;

            return res.json({
                success: true,
                payload: filteredQuizzes
            });
        } catch (e) {
            return res.sendStatus(500);
        }
    }

    /**
     * Returns active quizzes with limited content
     * @param req 
     * @param res 
     * @param next 
     */
    private async getUpcomingQuizWithoutContentByCourse(req: express.Request, res: express.Response, next: express.NextFunction | undefined) {
        try {
            const decodedToken = req.user as LoginResponse;
            const courseCode = decodedToken.courseId;
            
            if (!courseCode || !decodedToken || !decodedToken.user || !decodedToken.user._id) return res.sendStatus(500);

            const quizzes = await this.quizService.getActiveOrUpcomingQuizzesWithoutContent(courseCode, 'upcoming', decodedToken.isAdmin);

            if (!quizzes) return res.sendStatus(500);

            return res.json({
                success: true,
                payload: quizzes || []
            });
        } catch (e) {
            return res.sendStatus(500);
        }
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
        this.router.post("/create", isAdmin(), this.createQuiz.bind(this));
        this.router.put("/update", isAdmin(), this.updateQuiz.bind(this));
        this.router.delete("/delete/:questionId", isAdmin(), this.deleteQuiz.bind(this));
        this.router.get("/course/:courseId", isAdmin(), this.getQuizByCourse.bind(this));
        this.router.get("/active", StudentAuthenticatorMiddleware.checkUserId(), this.getActiveQuizWithoutContentByCourse.bind(this));
        this.router.get("/upcoming", StudentAuthenticatorMiddleware.checkUserId(), this.getUpcomingQuizWithoutContentByCourse.bind(this));
        this.router.put("/marks-visibility", isAdmin(), this.updateQuizMarksVisibility.bind(this));
    }
}
