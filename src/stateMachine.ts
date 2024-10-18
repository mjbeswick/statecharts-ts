/**
 * Represents a state transition in the state machine.
 * @template S - The type of the state.
 * @template E - The type of the event.
 * @template C - The type of the context.
 * @template T - The type of the transition key.
 */
export type StateTransition<S extends string, E extends { type: string }, C, T extends E['type']> = {
    target: S;
    guard?: (context: C, event: Extract<E, { type: T }>) => boolean;
    action?: (context: C, event: Extract<E, { type: T }>) => (() => void) | void;
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
export type TransitionMap<S extends string, E extends { type: string }, C> = {
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
export function createStateMachine<
    S extends string | string[],
    E extends { type: string },
    C
>(config: {
    initialState: S;
    context: C;
    transitionMap: TransitionMap<string, E, C>;
}) {
    let currentState = config.initialState;
    let context = config.context;
    let exitFn: (() => void) | undefined = undefined;
    const subscribers: Array<(state: S, context: C) => void> = [];

    /**
     * Gets the current state of the state machine.
     * @returns The current state.
     */
    function getState() {
        return currentState;
    }

    /**
     * Gets the current context of the state machine.
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
            handleParallelStateTransitions(event);
        } else {
            handleSingleStateTransition(event);
        }
        notifySubscribers();
    }

    function handleSingleStateTransition(event: E) {
        const transitions = getTransitionsForState(currentState as string);
        if (transitions) {
            const transition = transitions[event.type as keyof typeof transitions];
            if (transition && (!transition.guard || transition.guard(context, event as Extract<E, { type: typeof event.type }>))) {
                if (exitFn) {
                    exitFn();
                }
                if (transition.action) {
                    const result = transition.action(context, event as Extract<E, { type: typeof event.type }>);
                    if (typeof result === 'function') {
                        exitFn = result;
                    }
                }
                currentState = transition.target as S;
            }
        }
    }

    function handleParallelStateTransitions(event: E) {
        let newStates: string[] = [];
        (currentState as string[]).forEach((state: string) => {
            const transitions = getTransitionsForState(state);
            if (transitions) {
                const transition = transitions[event.type as keyof typeof transitions];
                if (transition && (!transition.guard || transition.guard(context, event as Extract<E, { type: typeof event.type }>))) {
                    if (exitFn) {
                        exitFn();
                    }
                    if (transition.action) {
                        const result = transition.action(context, event as Extract<E, { type: typeof event.type }>);
                        if (typeof result === 'function') {
                            exitFn = result;
                        }
                    }
                    newStates.push(transition.target as string);
                } else {
                    newStates.push(state);
                }
            } else {
                newStates.push(state);
            }
        });
        currentState = newStates as S;
    }

    function getTransitionsForState(state: string): { [key: string]: StateTransition<string, E, C, E['type']> } | undefined {
        return config.transitionMap[state] as { [key: string]: StateTransition<string, E, C, E['type']> } | undefined;
    }

    /**
     * Subscribes a callback function to be notified of state changes.
     * @param callback - The function to be called when the state changes.
     */
    function subscribe(callback: (state: S, context: C) => void) {
        subscribers.push(callback);
    }

    function notifySubscribers() {
        for (const subscriber of subscribers) {
            subscriber(currentState, context);
        }
    }

    /**
     * Serializes the current state and context to a JSON string.
     * @returns A JSON string representation of the current state and context.
     */
    function toJSON() {
        return JSON.stringify({ state: currentState, context });
    }

    /**
     * Deserializes a JSON string to update the current state and context.
     * @param json - A JSON string representation of the state and context.
     */
    function fromJSON(json: string) {
        const data = JSON.parse(json);
        currentState = data.state;
        context = data.context;
        notifySubscribers();
    }

    return {
        getState,
        getContext,
        send,
        subscribe,
        toJSON,
        fromJSON,
    };
}
