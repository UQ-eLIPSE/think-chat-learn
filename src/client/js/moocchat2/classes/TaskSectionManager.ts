import * as $ from "jquery";

import {EventBox} from "../../../../common/js/classes/EventBox";
import {TaskSection} from "./TaskSection";

/**
 * MOOCchat
 * Task section manager class module
 * 
 * Handles all task sections in the sidebar
 */
export class TaskSectionManager {
    private sections: { [id: string]: TaskSection } = {};
    
    private sharedEventManager: EventBox;

    private $taskSectionRootElem: JQuery;

    /**
     * @param {JQuery} $taskSectionRootElem Root element where task sections are to be inserted
     */
    constructor(sharedEventManager: EventBox, $taskSectionRootElem: JQuery) {
        this.sharedEventManager = sharedEventManager;
        this.$taskSectionRootElem = $taskSectionRootElem;
    }

    /**
     * Registers a task section.
     * 
     * @param {string} id A unique identifier
     * @param {string} text Text label to show on the element
     * @param {number} ms Timer value in milliseconds 
     */
    public register(id: string, text: string, ms?: number) {
        const newSection = new TaskSection(id, text, ms);
        this.$taskSectionRootElem.append(newSection.elem);
        this.sections[newSection.identifier] = newSection;
    }

    /**
     * Registers multiple task sections.
     * 
     * @param {TaskSectionDefinition[]} sectionDefinitions
     */
    public registerAll(sectionDefinitions: TaskSectionDefinition[]) {
        sectionDefinitions.forEach((section) => {
            this.register.apply(this, section);
        });
    }

    /**
     * Gets requested section.
     * 
     * @param {string} id
     */
    public getSection(id: string) {
        return this.sections[id];
    }

}

/**
 * Type mirrors TaskSection constructor parameters as array
 */
export type TaskSectionDefinition = [string, string] | [string, string, number];
