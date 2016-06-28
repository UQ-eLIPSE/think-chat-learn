import {IStateTransition} from "./IStateTransition";

import {MoocchatSession} from "./MoocchatSession";

/**
 * MOOCchat
 * PageFunc interface
 * 
 * Encodes the structure expected for the returned function for each page handler.
 */
export interface IPageFunc<StateEnumType> {
    (session: MoocchatSession<StateEnumType>): IStateTransition<StateEnumType>
}
