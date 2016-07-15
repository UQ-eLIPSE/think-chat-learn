import {IStateTransition} from "./IStateTransition";

import {MoocchatSession} from "./MoocchatSession";

/**
 * MOOCchat
 * StateHandler interface
 * 
 * Encodes the structure expected for the returned function for each page handler.
 */
export interface IStateHandler<StateEnumType> {
    (session: MoocchatSession<StateEnumType>, ...args: any[]): IStateTransition<StateEnumType>;
}
