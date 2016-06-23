/*
 * MOOCchat
 * Task section manager class module
 * 
 * Handles all task sections in the sidebar
 */

import {Utils} from "./Utils";
import {TaskSection} from "./TaskSection";

export class TaskSectionManager {
    private sections: { [id: string]: TaskSection } = {};

    private $taskSectionRootElem: JQuery;

    constructor($taskSectionRootElem: JQuery) {
        this.$taskSectionRootElem = $taskSectionRootElem;
    }

    // TODO: Fix any[] type
    public registerAll(sectionDefinitions: any[]) {
        sectionDefinitions.forEach((section) => {
            let newSection = Utils.Object.applyConstructor<TaskSection>(TaskSection, section);
            this.$taskSectionRootElem.append(newSection.elem);
            this.sections[newSection.identifier] = newSection;
        });
    }

    public getSection(id: string) {
        return this.sections[id];
    }

}
