// src/index.ts

export type StateTransition<S extends string, E extends { type: string }, C> = {
    target: S;
    enter?: (context: C, event: E) => void;
    exit?: (context: C, event: E) => void;
};

export type TransitionMap<S extends string, E extends { type: string }, C> = {
    [K in S]?: {
        [T in E['type']]?: StateTransition<S, E, C>;
    };
};

export function createStateMachine<
    S extends string,
    E extends { type: string },
    C
>(config: {
    initialState: S;
    context: C;
    transitionMap: TransitionMap<S, E, C>;
}) {
    let currentState = config.initialState;
    let context = config.context;
    const subscribers: Array<(state: S, context: C) => void> = [];

    function getState() {
        return currentState;
    }

    function getContext() {
        return context;
    }

    function send(event: E) {
        const stateTransitions = config.transitionMap[currentState];
        if (stateTransitions) {
            const transition = stateTransitions[event.type as keyof typeof stateTransitions] as StateTransition<S, E, C> | undefined;
            if (transition) {
                if (transition.exit) {
                    transition.exit(context, event);
                }
                if (transition.enter) {
                    transition.enter(context, event);
                }
                currentState = transition.target;
                notifySubscribers();
            }
        }
    }

    function subscribe(callback: (state: S, context: C) => void) {
        subscribers.push(callback);
    }

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
