/**
 * Defines the structure for state transitions, including target state and optional enter/exit actions.
 * 
 * @template S - Type of the state (can be string, number, or symbol).
 * @template C - Type of the context (represents additional information used during transitions).
 */
export type StateTransition<S, C> = {
    /** Target state to transition to. */
    target: S;
    /** Optional action to perform when entering the new state. */
    enter?: (context: C) => void;
    /** Optional action to perform when exiting the current state. */
    exit?: (context: C) => void;
};

/**
 * A map that defines valid transitions for each state and event.
 * 
 * @template S - Type of the state (can be string, number, or symbol).
 * @template E - Type of the event (contains a 'type' property to determine the transition).
 * @template C - Type of the context (represents additional information used during transitions).
 */
export type TransitionMap<
    S extends string | number | symbol,
    E extends { type: string },
    C
> = {
        [K in S]?: {
            [T in E['type']]?: StateTransition<S, C>;
        };
    };

/**
 * Abstract class that represents a finite state machine. It provides core functionality to manage state transitions,
 * handle context, and notify subscribers of state changes.
 * 
 * @template S - Type of the state (can be string, number, or symbol).
 * @template E - Type of the event (contains a 'type' property to determine the transition).
 * @template C - Type of the context (represents additional information used during transitions).
 */
export abstract class AbstractStateMachine<
    S extends string | number | symbol,
    E extends { type: string },
    C
> {
    /** Current state of the state machine. */
    protected abstract currentState: S;

    /** Context that holds additional information related to the state machine. */
    protected abstract context: C;

    /** Transition map that defines the possible state transitions and associated actions. */
    protected abstract transitionMap: TransitionMap<S, E, C>;

    /** List of subscribers to notify of state changes. */
    private subscribers: ((state: S, context: C) => void)[] = [];

    /**
     * Gets the current state of the state machine.
     * 
     * @returns {S} The current state.
     */
    public getState(): S {
        return this.currentState;
    }

    /**
     * Gets the current context of the state machine.
     * 
     * @returns {C} The current context.
     */
    public getContext(): C {
        return this.context;
    }

    /**
     * Sends an event to the state machine, triggering a state transition if a valid transition is defined.
     * 
     * @param {E} event - The event to trigger a state transition.
     */
    public send(event: E): void {
        const stateKey = this.currentState;
        const stateTransitions = this.transitionMap[stateKey];

        if (stateTransitions) {
            const eventKey = event.type as keyof typeof stateTransitions;
            const transition = stateTransitions[eventKey];

            if (transition) {
                if (transition.exit) {
                    transition.exit(this.context);
                }
                if (transition.enter) {
                    transition.enter(this.context);
                }
                this.currentState = transition.target;
                this.notifySubscribers();
            }
        }
    }

    /**
     * Subscribes to state changes of the state machine. When a state transition occurs,
     * the callback function is called with the new state and context.
     * 
     * @param {(state: S, context: C) => void} callback - The function to call when the state changes.
     */
    public subscribe(callback: (state: S, context: C) => void): void {
        this.subscribers.push(callback);
    }

    /**
     * Notifies all subscribers of the current state and context.
     * 
     * @private
     */
    private notifySubscribers(): void {
        for (const subscriber of this.subscribers) {
            subscriber(this.currentState, this.context);
        }
    }
}
