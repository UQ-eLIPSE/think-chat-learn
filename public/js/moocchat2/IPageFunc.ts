import {IStateTransition} from "./IStateTransition";

import {StateFlow} from "./StateFlow";
import {PageManager} from "./PageManager";
import {TaskSectionManager} from "./TaskSectionManager";

export interface IPageFunc<StateEnumType> {
    (stateMachine: StateFlow<StateEnumType>, pageManager: PageManager, secManager: TaskSectionManager): IStateTransition<StateEnumType>
}
