import { Component } from "./Component";

import { LayoutData } from "./LayoutData";

export abstract class ComponentRenderable extends Component {
    private readonly renderTarget: JQuery;
    private readonly layoutData: LayoutData;

    private renderFunc: ((renderTarget: JQuery) => void) | undefined;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent?: Component) {
        super(parent);
        this.renderTarget = renderTarget;
        this.layoutData = layoutData;
    }

    protected getRenderTarget() {
        return this.renderTarget;
    }

    protected getLayoutData() {
        return this.layoutData;
    }

    protected setRenderFunc(renderFunc: (renderTarget: JQuery) => void) {
        this.renderFunc = renderFunc;
    }

    public render() {
        this.renderFunc && this.renderFunc(this.renderTarget);
    }
}