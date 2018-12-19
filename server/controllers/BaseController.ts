import * as express from "express";

export abstract class BaseController {
    protected router: express.Router;

    constructor() {
        this.router = express.Router();
    }

    public getRouter(): express.Router {
        return this.router;
    }

    public abstract setupRoutes(): void;
}