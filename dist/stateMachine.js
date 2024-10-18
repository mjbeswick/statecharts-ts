"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStateMachine = createStateMachine;
/**
 * Creates a state machine with the given configuration.
 * @template S - The type of the state, which can be a string or an array of strings.
 * @template E - The type of the event, which must have a 'type' property.
 * @template C - The type of the context.
 * @param config - The configuration object for the state machine.
 * @returns An object with methods to interact with the state machine.
 */
function createStateMachine(config) {
    let currentState = config.initialState;
    let context = config.context;
    let exitFn = undefined;
    const subscribers = [];
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
    function send(event) {
        if (Array.isArray(currentState)) {
            handleParallelStateTransitions(event);
        }
        else {
            handleSingleStateTransition(event);
        }
        notifySubscribers();
    }
    function handleSingleStateTransition(event) {
        const transitions = getTransitionsForState(currentState);
        if (transitions) {
            const transition = transitions[event.type];
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
                currentState = transition.target;
            }
        }
    }
    function handleParallelStateTransitions(event) {
        let newStates = [];
        currentState.forEach((state) => {
            const transitions = getTransitionsForState(state);
            if (transitions) {
                const transition = transitions[event.type];
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
                    newStates.push(transition.target);
                }
                else {
                    newStates.push(state);
                }
            }
            else {
                newStates.push(state);
            }
        });
        currentState = newStates;
    }
    function getTransitionsForState(state) {
        return config.transitionMap[state];
    }
    /**
     * Subscribes a callback function to be notified of state changes.
     * @param callback - The function to be called when the state changes.
     */
    function subscribe(callback) {
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
    function fromJSON(json) {
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
//# sourceMappingURL=stateMachine.js.map