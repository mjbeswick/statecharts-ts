// src/stateMachine.ts

/**
 * Represents a state transition in the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 * @template T - The specific event type for this transition.
 */
export type StateTransition<S extends string, E extends { type: string }, C, T extends E['type']> = {
    target: S;
    guard?: (params: { context: C; event: Extract<E, { type: T }> }) => boolean;
    action?: (params: { context: C; event: Extract<E, { type: T }>, send: (event: E) => void }) => (() => void) | void;
} | Array<{
    target: S;
    guard?: (params: { context: C; event: Extract<E, { type: T }> }) => boolean;
    action?: (params: { context: C; event: Extract<E, { type: T }>, send: (event: E) => void }) => (() => void) | void;
}>;

/**
 * Represents a nested state in the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 */
export type NestedState<S extends string, E extends { type: string }, C> = {
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

/**
 * Represents the transition map for the state machine.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 */
export type TransitionMap<S extends string, E extends { type: string }, C> = {
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
export function createStateMachine<
    S extends string,
    E extends { type: string },
    C
>(config: {
    context: C;
    states: TransitionMap<S, E, C>;
}) {
    let currentState: FlattenedState<S> = initializeState(config.states);
    let context = structuredClone(config.context);
    let exitFn: (() => void) | undefined = undefined;
    const subscribers: Array<(state: S, context: C) => void> = [];
    let timeoutIds: { [state: string]: ReturnType<typeof setTimeout> } = {};

    /**
     * Starts the state machine by entering the initial state(s).
     */
    function start() {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => enterState(state));
        } else {
            enterState(currentState as S);
        }
        notifySubscribers();
    }

    /**
     * Enters a specific state, triggering onEntry actions and setting up timeouts.
     * @param state - The state to enter.
     */
    function enterState(state: S) {
        const stateDef = config.states[state];
        if (stateDef) {
            if (stateDef.onEntry) {
                stateDef.onEntry({ context, state, send });
            }
            setStateTimeout(state, stateDef);
        }
    }

    /**
     * Gets the current state of the machine.
     * @returns The current state or states.
     */
    function getState() {
        return currentState;
    }

    /**
     * Gets the current context of the machine.
     * @returns The current context.
     */
    function getContext() {
        return context;
    }

    /**
     * Sends an event to the state machine, potentially triggering a state transition.
     * @param event - The event to send.
     */
    function send(event: E) {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => handleSingleStateTransition(state, event));
        } else {
            handleSingleStateTransition(currentState as S, event);
        }
        notifySubscribers();
    }

    /**
     * Handles a single state transition by clearing the current state's timeout and processing the transition.
     * @param state - The state to handle the transition for.
     * @param event - The event that triggered the transition.
     */
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

    /**
     * Processes a state transition by executing the transition's action if the guard is true.
     * @param transition - The transition to process.
     * @param event - The event that triggered the transition.
     */
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

    /**
     * Executes the action of a state transition, potentially updating the current state and context.
     * @param transition - The transition to execute.
     * @param event - The event that triggered the transition.
     */
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

    /**
     * Sets a timeout for the current state.
     * @param state - The state to set the timeout for.
     * @param stateDef - The state definition for the state.
     */
    function setStateTimeout(state: S, stateDef: StateDefinition<S, E, C>) {
        if (stateDef.onTimeout) {
            const delay = stateDef.onTimeout.delay(context);
            timeoutIds[state] = setTimeout(() => {
                stateDef.onTimeout!.action({ context, state, send });
            }, delay) as unknown as NodeJS.Timeout;
        }
    }

    /**
     * Clears the timeout for the current state.
     * @param state - The state to clear the timeout for.
     */
    function clearStateTimeout(state: S) {
        if (timeoutIds[state]) {
            clearTimeout(timeoutIds[state]);
            delete timeoutIds[state];
        }
    }

    /**
     * Subscribes a callback function to be notified of state changes.
     * @param callback - The function to be called when the state changes.
     */
    function subscribe(callback: (state: S, context: C) => void) {
        subscribers.push(callback);
    }

    /**
     * Converts the current state and context to a JSON string.
     * @returns A JSON string representation of the current state and context.
     */
    function toJSON() {
        return JSON.stringify({ state: currentState, context });
    }

    /**
     * Restores the state machine's state and context from a JSON string.
     * @param json - The JSON string to restore from.
     */
    function fromJSON(json: string) {
        const data = JSON.parse(json);
        currentState = data.state;
        context = data.context;
    }

    /**
     * Notifies all subscribers of the current state and context.
     */
    function notifySubscribers() {
        const flattenedStates = flattenState(currentState);
        flattenedStates.forEach(state => {
            subscribers.forEach(callback => callback(state, context));
        });
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

/**
 * Initializes the state machine by determining the initial state(s).
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 * @param states - The transition map defining the states of the machine.
 * @returns The initial state or states.
 * @throws {Error} If no initial state is defined.
 */
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

/**
 * Flattens a potentially nested state into an array of string states.
 * @template S - The type of states in the machine.
 * @param state - The state or array of states to flatten.
 * @returns An array of flattened states.
 */
function flattenState<S extends string>(state: FlattenedState<S>): S[] {
    if (typeof state === 'string') {
        return [state];
    }
    return state.flatMap(s => flattenState<S>(s));
}

/**
 * Represents a state or an array of states in the state machine.
 * @template S - The type of states in the machine.
 */
type FlattenedState<S extends string> = S | S[];
