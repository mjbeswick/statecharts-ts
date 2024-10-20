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
export type NestedState<S extends string, E extends {
    type: string;
}, C> = {
    type?: 'compound' | 'parallel';
    states: {
        [key: string]: StateDefinition<S, E, C>;
    };
};
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
export type TransitionMap<S extends string, E extends {
    type: string;
}, C> = {
    [K in S]?: StateDefinition<S, E, C>;
};
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
type FlattenedState<S extends string> = S | S[];
export {};
