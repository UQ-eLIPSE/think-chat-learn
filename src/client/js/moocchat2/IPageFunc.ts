import {IStateTransition} from "./IStateTransition";

import {MoocchatSession} from "./MoocchatSession";

export interface IPageFunc<StateEnumType> {
    (session: MoocchatSession<StateEnumType>): IStateTransition<StateEnumType>
}
