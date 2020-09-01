import { Document, Page, MarkConfig } from "./DBSchema";

// The purpose of this interface is to accomodate for network requests which
// removes functionality of Dates
export interface IQuizOverNetwork extends Document {
    title?: string;
    pages?: Page[];
    course?: string;
    // Note while the functionality-wise the start and end are dates,
    // they are stored as strings due the fact that sending a date over is not feasible
    availableStart?: string;
    availableEnd?: string;
    groupSize?: number;
    markingConfiguration?: MarkConfig;
    rubricId?: string;
    isPublic?: boolean;
}
