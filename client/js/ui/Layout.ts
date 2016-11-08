import { LayoutData } from "./LayoutData";

export class Layout {
    private readonly name: string;
    private readonly data: LayoutData;

    constructor(name: string, data: LayoutData) {
        this.name = name;
        this.data = data;
    }

    private getLayout() {
        return this.data.getLayout(this.name);
    }

    public wipeThenAppendTo($elem: JQuery) {
        $elem.empty();
        return this.appendTo($elem);
    }

    public appendTo($elem: JQuery) {
        const {promise, xhr} = this.getLayout();

        const layoutPromise = promise
            .then((layoutElement) => {
                $elem.append(layoutElement);
                return layoutElement;
            });

        return {
            promise: layoutPromise,
            xhr,
        }
    }

    // public replace($elem: JQuery) {
    //     const {promise, xhr} = this.getLayout();

    //     const layoutPromise = promise
    //         .then((layoutElement) => {
    //             $elem.replaceWith(layoutElement);
    //             return layoutElement;
    //         });

    //     return {
    //         promise: layoutPromise,
    //         xhr,
    //     }
    // }
}