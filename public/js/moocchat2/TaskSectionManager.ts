/*
 * MOOCchat
 * Task section manager class module
 * 
 * Handles all task sections in the sidebar
 */

import {Utils} from "./Utils";
import {TaskSection} from "./TaskSection";

/**
 * Type mirrors TaskSection constructor parameters as array
 */
export type TaskSectionDefinition = [string, string] | [string, string, number];

export class TaskSectionManager {
    private sections: { [id: string]: TaskSection } = {};

    private $taskSectionRootElem: JQuery;

    constructor($taskSectionRootElem: JQuery) {
        this.$taskSectionRootElem = $taskSectionRootElem;
    }

    public register(id: string, text: string, ms?: number) {
        let newSection = new TaskSection(id, text, ms);
        this.$taskSectionRootElem.append(newSection.elem);
        this.sections[newSection.identifier] = newSection;
    }

    public registerAll(sectionDefinitions: TaskSectionDefinition[]) {
        sectionDefinitions.forEach((section) => {
            this.register.apply(this, section);
        });
    }

    public getSection(id: string) {
        return this.sections[id];
    }

}
