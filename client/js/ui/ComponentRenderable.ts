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

    protected readonly $ = (selector?: string) => {
        const renderTarget = this.getRenderTarget();

        if (!selector) {
            return renderTarget;
        }

        return $(selector, renderTarget);
    }

    protected readonly section$ = (selector?: string) => {
        const $section = this.$("> section");

        if (!selector) {
            return $section;
        }

        return $(selector, $section);
    }

    public render() {
        this.renderFunc && this.renderFunc(this.renderTarget);
    }
}