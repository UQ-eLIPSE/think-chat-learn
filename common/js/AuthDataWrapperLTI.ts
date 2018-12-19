import { ILTIData } from "../interfaces/ILTIData";

export class AuthDataWrapperLTI {

    private readonly data: ILTIData;

    constructor(data: ILTIData | undefined) {
        if (!data) {
            throw new Error(`LTI data missing`);
        }

        this.data = data;
    }

    public stringify() {
        return JSON.stringify(this.data);
    }

    public getData() {
        return this.data;
    }

    public getCourseName() {
        const contextLabel = this.data.context_label || "";
        const contextTitle = this.data.context_title || "";

        let courseName: string;

        // Get course name from context_label first, then try using value in square brackets in title
        courseName = contextLabel.split("_")[0];

        if (courseName.length <= 4) {
            // http://stackoverflow.com/a/11013275
            let stringsInSquareBrackets = contextTitle.match(/[^[\]]+(?=])/g);

            if (stringsInSquareBrackets) {
                courseName = stringsInSquareBrackets[0];
            } else {
                courseName = "";
            }
        }

        return courseName;
    }

}