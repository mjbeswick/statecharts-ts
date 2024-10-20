// src/stateMachine.ts

export type StateTransition<S extends string, E extends { type: string }, C, T extends E['type']> = {
    target: S;
    guard?: (params: { context: C; event: Extract<E, { type: T }> }) => boolean;
    action?: (params: { context: C; event: Extract<E, { type: T }>, send: (event: E) => void }) => (() => void) | void;
} | Array<{
    target: S;
    guard?: (params: { context: C; event: Extract<E, { type: T }> }) => boolean;
    action?: (params: { context: C; event: Extract<E, { type: T }>, send: (event: E) => void }) => (() => void) | void;
}>;

export type NestedState<S extends string, E extends { type: string }, C> = {
    type?: 'compound' | 'parallel';
    states: {
        [key: string]: StateDefinition<S, E, C>;
    };
};

export type StateDefinition<S extends string, E extends { type: string }, C> = {
    isInitial?: boolean;
    isParallel?: boolean; // Use isParallel for parallel states
    onEntry?: (params: { context: C; state: S; send: (event: E) => void }) => void;
    onExit?: (params: { context: C; state: S; send: (event: E) => void }) => void;
    onTimeout?: {
        delay: (context: C) => number;
        action: (params: { context: C; state: S; send: (event: E) => void }) => void;
    };
    transitions?: {
        [T in E['type']]?: StateTransition<S, E, C, T>;
    };
    states?: {
        [key: string]: StateDefinition<S, E, C>;
    };
};

export type TransitionMap<S extends string, E extends { type: string }, C> = {
    [K in S]?: StateDefinition<S, E, C>;
};

export function createStateMachine<
    S extends string,
    E extends { type: string },
    C
>(config: {
    context: C;
    states: TransitionMap<S, E, C>;
}) {
    let currentState: FlattenedState<S> = initializeState(config.states);
    let context = config.context;
    let exitFn: (() => void) | undefined = undefined;
    const subscribers: Array<(state: S, context: C) => void> = [];
    let timeoutIds: { [state: string]: NodeJS.Timeout } = {};

    function start() {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => enterState(state));
        } else {
            enterState(currentState as S);
        }
        notifySubscribers();
    }

    function enterState(state: S) {
        const stateDef = config.states[state];
        if (stateDef) {
            if (stateDef.onEntry) {
                stateDef.onEntry({ context, state, send });
            }
            setStateTimeout(state, stateDef);
        }
    }

    function getState() {
        return currentState;
    }

    function getContext() {
        return context;
    }

    function send(event: E) {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => handleSingleStateTransition(state, event));
        } else {
            handleSingleStateTransition(currentState as S, event);
        }
        notifySubscribers();
    }

    function handleSingleStateTransition(state: S, event: E) {
        const stateDef = config.states[state];
        if (stateDef) {
            clearStateTimeout(state);
            const transitions = stateDef.transitions;
            const transition = transitions?.[event.type as E['type']];
            if (transition) {
                processTransition(transition, event);
            }
        }
    }

    function processTransition(transition: StateTransition<S, E, C, E['type']>, event: E) {
        if (Array.isArray(transition)) {
            for (const t of transition) {
                if (t.guard && !t.guard({ context, event: event as Extract<E, { type: E['type'] }> })) {
                    continue;
                }
                executeTransitionAction(t, event);
                break; // Handle first valid transition only
            }
        } else {
            if (!transition.guard || transition.guard({ context, event: event as Extract<E, { type: typeof event.type }> })) {
                executeTransitionAction(transition, event);
            }
        }
    }

    function executeTransitionAction(transition: StateTransition<S, E, C, E['type']>, event: E) {
        if (exitFn) {
            exitFn();
        }
        if ('action' in transition && transition.action) {
            const result = transition.action({ context, event: event as Extract<E, { type: typeof event.type }>, send });
            if (typeof result === 'function') {
                exitFn = result;
            }
        }
        currentState = (transition as { target: S }).target;
        enterState(currentState as S);
    }

    function setStateTimeout(state: S, stateDef: StateDefinition<S, E, C>) {
        if (stateDef.onTimeout) {
            const delay = stateDef.onTimeout.delay(context);
            timeoutIds[state] = setTimeout(() => {
                stateDef.onTimeout!.action({ context, state, send });
            }, delay);
        }
    }

    function clearStateTimeout(state: S) {
        if (timeoutIds[state]) {
            clearTimeout(timeoutIds[state]);
            delete timeoutIds[state];
        }
    }

    function subscribe(callback: (state: S, context: C) => void) {
        subscribers.push(callback);
    }

    function notifySubscribers() {
        for (const subscriber of subscribers) {
            subscriber(currentState as S, context);
        }
    }

    function toJSON() {
        return JSON.stringify({ state: currentState, context });
    }

    function fromJSON(json: string) {
        const data = JSON.parse(json);
        currentState = data.state;
        context = data.context;
    }

    return {
        getState,
        getContext,
        send,
        subscribe,
        toJSON,
        fromJSON,
        start, // Ensure start is exposed
    };
}

type FlattenedState<S extends string> = S | S[];

function initializeState<S extends string, E extends { type: string }, C>(
    states: TransitionMap<S, E, C>
): FlattenedState<S> {
    const initialStates = Object.entries(states).filter(([_, stateDef]) =>
        (stateDef as StateDefinition<S, E, C>)?.isInitial
    );

    if (initialStates.length === 0) {
        throw new Error("No initial state defined");
    }

    if (initialStates.length === 1) {
        return initialStates[0][0] as S;
    }

    return initialStates.map(([state, _]) => state) as S[];
}

function flattenState<S extends string>(state: FlattenedState<S>): S[] {
    if (typeof state === 'string') {
        return [state];
    }
    return state.flatMap(s => flattenState<S>(s));
}
