/**
 * Represents a state transition in the state machine.
 * @template S - The type of the state.
 * @template E - The type of the event.
 * @template C - The type of the context.
 * @template T - The type of the transition key.
 */
export type StateTransition<S extends string, E extends {
    type: string;
}, C, T extends E['type']> = {
    target: S;
    guard?: (context: C, event: Extract<E, {
        type: T;
    }>) => boolean;
    action?: (context: C, event: Extract<E, {
        type: T;
    }>) => (() => void) | void;
};
/**
 * Represents a nested state structure.
 * @template S - The type of the state.
 */
export type NestedState<S extends string> = {
    [key: string]: S | NestedState<S>;
};
/**
 * Represents a map of transitions for each state.
 * @template S - The type of the state.
 * @template E - The type of the event, which must have a 'type' property.
 * @template C - The type of the context.
 */
export type TransitionMap<S extends string, E extends {
    type: string;
}, C> = {
    [K in S]?: {
        [T in E['type']]?: StateTransition<S, E, C, T>;
    };
};
/**
 * Creates a state machine with the given configuration.
 * @template S - The type of the state, which can be a string or an array of strings.
 * @template E - The type of the event, which must have a 'type' property.
 * @template C - The type of the context.
 * @param config - The configuration object for the state machine.
 * @returns An object with methods to interact with the state machine.
 */
export declare function createStateMachine<S extends string | string[], E extends {
    type: string;
}, C>(config: {
    initialState: S;
    context: C;
    transitionMap: TransitionMap<string, E, C>;
}): {
    getState: () => S;
    getContext: () => C;
    send: (event: E) => void;
    subscribe: (callback: (state: S, context: C) => void) => void;
    toJSON: () => string;
    fromJSON: (json: string) => void;
};
