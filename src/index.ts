export type StateTransition<S extends string, E extends { type: string }, C> = {
    target: S;
    guard?: (context: C, event: E) => boolean;
    action?: (context: C, event: E) => (() => void) | void;
};

export type NestedState<S extends string> = {
    [key: string]: S | NestedState<S>;
};

export type TransitionMap<S extends string, E extends { type: string }, C> = {
    [K in S]?: {
        [T in E['type']]?: StateTransition<S, E, C>;
    };
};

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

    function getState() {
        return currentState;
    }

    function getContext() {
        return context;
    }

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
            const transition = transitions[event.type as keyof typeof transitions] as StateTransition<string, E, C> | undefined;
            if (transition && (!transition.guard || transition.guard(context, event))) {
                if (exitFn) {
                    exitFn();
                }
                if (transition.action) {
                    const result = transition.action(context, event);
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
                const transition = transitions[event.type as keyof typeof transitions] as StateTransition<string, E, C> | undefined;
                if (transition && (!transition.guard || transition.guard(context, event))) {
                    if (exitFn) {
                        exitFn();
                    }
                    if (transition.action) {
                        const result = transition.action(context, event);
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

    function getTransitionsForState(state: string): { [key: string]: StateTransition<string, E, C> } | undefined {
        return config.transitionMap[state] as { [key: string]: StateTransition<string, E, C> } | undefined;
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
