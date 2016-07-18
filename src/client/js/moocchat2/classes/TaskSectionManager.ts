import {EventBox} from "./EventBox";
import {TaskSection} from "./TaskSection";

/**
 * Type mirrors TaskSection constructor parameters as array
 */
export type TaskSectionDefinition = [string, string] | [string, string, number];

/**
 * MOOCchat
 * Task section manager class module
 * 
 * Handles all task sections in the sidebar
 */
export class TaskSectionManager {
    private sections: { [id: string]: TaskSection } = {};
    
    private eventBox: EventBox;

    private $taskSectionRootElem: JQuery;

    /**
     * @param {JQuery} $taskSectionRootElem Root element where task sections are to be inserted
     */
    constructor(eventBox: EventBox, $taskSectionRootElem: JQuery) {
        this.eventBox = eventBox;
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
