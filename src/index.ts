/**
 * Represents a transition between states in a state machine.
 * @template S The type of state.
 * @template E The type of event.
 * @template C The type of context.
 */
export type StateTransition<S extends string, E extends { type: string }, C> = {
    /**
     * The target state to transition to.
     */
    target: S;

    /**
     * A guard function that takes context and event as arguments and returns a boolean.
     * If the guard function returns false, the transition is prevented.
     * If the guard function is not defined, the transition is always allowed.
     */
    guard?: (context: C, event: E) => boolean;

    /**
     * An action function that takes context and event as arguments and returns a function or undefined.
     * If the action function returns a function, it is called when the state is exited.
     * If the action function returns undefined or nothing, no action is taken when the state is exited.
     */
    action?: (context: C, event: E) => (() => void) | void;
};

/**
 * Represents a map of transitions between states in a state machine.
 * @template S The type of state.
 * @template E The type of event.
 * @template C The type of context.
 */
export type TransitionMap<S extends string, E extends { type: string }, C> = {
    [K in S]?: {
        [T in E['type']]?: StateTransition<S, E, C>;
    };
};

/**
 * Creates a state machine with the given configuration.
 * @template S The type of state.
 * @template E The type of event.
 * @template C The type of context.
 * @param config The configuration object for the state machine.
 * @returns The state machine object.
 */
export function createStateMachine<
    S extends string,
    E extends { type: string },
    C
>(config: {
    /**
     * The initial state of the state machine.
     */
    initialState: S;

    /**
     * The initial context of the state machine.
     */
    context: C;

    /**
     * The transition map for the state machine.
     */
    transitionMap: TransitionMap<S, E, C>;
}) {
    let currentState = config.initialState;
    let context = config.context;
    let exitFn: (() => void) | undefined = undefined;
    const subscribers: Array<(state: S, context: C) => void> = [];

    /**
     * Returns the current state of the state machine.
     */
    function getState() {
        return currentState;
    }

    /**
     * Returns the current context of the state machine.
     */
    function getContext() {
        return context;
    }

    /**
     * Sends an event to the state machine, causing it to transition to a new state if possible.
     * @param event The event to send.
     */
    function send(event: E) {
        const stateTransitions = config.transitionMap[currentState];
        if (stateTransitions) {
            const transition = stateTransitions[event.type as keyof typeof stateTransitions] as StateTransition<S, E, C> | undefined;
            if (transition) {
                if (!transition.guard || transition.guard(context, event)) {
                    if (exitFn) {
                        exitFn();
                    }
                    if (transition.action) {
                        const result = transition.action(context, event);
                        if (typeof result === 'function') {
                            exitFn = result;
                        }
                    }
                    currentState = transition.target;
                    notifySubscribers();
                }
            }
        }
    }

    /**
     * Subscribes a callback function to the state machine, which will be called whenever the state machine transitions to a new state.
     * @param callback The callback function to subscribe.
     */
    function subscribe(callback: (state: S, context: C) => void) {
        subscribers.push(callback);
    }

    /**
     * Notifies all subscribers of the current state and context of the state machine.
     */
    function notifySubscribers() {
        for (const subscriber of subscribers) {
            subscriber(currentState, context);
        }
    }

    return {
        getState,
        getContext,
        send,
        subscribe,
    };
}