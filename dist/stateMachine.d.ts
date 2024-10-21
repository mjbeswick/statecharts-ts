/**
 * Represents a state transition in the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 * @template T - The specific event type for this transition.
 */
export type StateTransition<S extends string, E extends {
    type: string;
}, C, T extends E['type']> = {
    target: S;
    guard?: (params: {
        context: C;
        event: Extract<E, {
            type: T;
        }>;
    }) => boolean;
    action?: (params: {
        context: C;
        event: Extract<E, {
            type: T;
        }>;
        send: (event: E) => void;
    }) => (() => void) | void;
} | Array<{
    target: S;
    guard?: (params: {
        context: C;
        event: Extract<E, {
            type: T;
        }>;
    }) => boolean;
    action?: (params: {
        context: C;
        event: Extract<E, {
            type: T;
        }>;
        send: (event: E) => void;
    }) => (() => void) | void;
}>;
/**
 * Represents a nested state in the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 */
export type NestedState<S extends string, E extends {
    type: string;
}, C> = {
    type?: 'compound' | 'parallel';
    states: {
        [key: string]: StateDefinition<S, E, C>;
    };
};
/**
 * Defines the structure of a state in the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 */
export type StateDefinition<S extends string, E extends {
    type: string;
}, C> = {
    isInitial?: boolean;
    isParallel?: boolean;
    onEntry?: (params: {
        context: C;
        state: S;
        send: (event: E) => void;
    }) => void;
    onExit?: (params: {
        context: C;
        state: S;
        send: (event: E) => void;
    }) => void;
    onTimeout?: {
        delay: (context: C) => number;
        action: (params: {
            context: C;
            state: S;
            send: (event: E) => void;
        }) => void;
    };
    transitions?: {
        [T in E['type']]?: StateTransition<S, E, C, T>;
    };
    states?: {
        [key: string]: StateDefinition<S, E, C>;
    };
};
/**
 * Represents the transition map for the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 */
export type TransitionMap<S extends string, E extends {
    type: string;
}, C> = {
    [K in S]?: StateDefinition<S, E, C>;
};
/**
 * Creates a state machine with the given configuration.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 * @param config - The configuration object for the state machine.
 * @returns An object with methods to interact with the state machine.
 */
export declare function createStateMachine<S extends string, E extends {
    type: string;
}, C>(config: {
    context: C;
    states: TransitionMap<S, E, C>;
}): {
    getState: () => FlattenedState<S>;
    getContext: () => C;
    send: (event: E) => void;
    subscribe: (callback: (state: S, context: C) => void) => void;
    toJSON: () => string;
    fromJSON: (json: string) => void;
    start: () => void;
};
/**
 * Represents a state or an array of states in the state machine.
 * @template S - The type of states in the machine.
 */
type FlattenedState<S extends string> = S | S[];
export {};
