"use strict";
// src/stateMachine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStateMachine = createStateMachine;
/**
 * Creates a state machine with the given configuration.
 * @template S - The type of states in the machine.
 * @template E - The type of events that can trigger transitions.
 * @template C - The type of the context object.
 * @param config - The configuration object for the state machine.
 * @returns An object with methods to interact with the state machine.
 */
function createStateMachine(config) {
    let currentState = initializeState(config.states);
    let context = structuredClone(config.context);
    let exitFn = undefined;
    const subscribers = [];
    let timeoutIds = {};
    /**
     * Starts the state machine by entering the initial state(s).
     */
    function start() {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => enterState(state));
        }
        else {
            enterState(currentState);
        }
        notifySubscribers();
    }
    /**
     * Enters a specific state, triggering onEntry actions and setting up timeouts.
     * @param state - The state to enter.
     */
    function enterState(state) {
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
    function send(event) {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => handleSingleStateTransition(state, event));
        }
        else {
            handleSingleStateTransition(currentState, event);
        }
        notifySubscribers();
    }
    /**
     * Handles a single state transition by clearing the current state's timeout and processing the transition.
     * @param state - The state to handle the transition for.
     * @param event - The event that triggered the transition.
     */
    function handleSingleStateTransition(state, event) {
        const stateDef = config.states[state];
        if (stateDef) {
            clearStateTimeout(state);
            const transitions = stateDef.transitions;
            const transition = transitions === null || transitions === void 0 ? void 0 : transitions[event.type];
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
    function processTransition(transition, event) {
        if (Array.isArray(transition)) {
            for (const t of transition) {
                if (t.guard && !t.guard({ context, event: event })) {
                    continue;
                }
                executeTransitionAction(t, event);
                break; // Handle first valid transition only
            }
        }
        else {
            if (!transition.guard || transition.guard({ context, event: event })) {
                executeTransitionAction(transition, event);
            }
        }
    }
    /**
     * Executes the action of a state transition, potentially updating the current state and context.
     * @param transition - The transition to execute.
     * @param event - The event that triggered the transition.
     */
    function executeTransitionAction(transition, event) {
        if (exitFn) {
            exitFn();
        }
        if ('action' in transition && transition.action) {
            const result = transition.action({ context, event: event, send });
            if (typeof result === 'function') {
                exitFn = result;
            }
        }
        currentState = transition.target;
        enterState(currentState);
    }
    /**
     * Sets a timeout for the current state.
     * @param state - The state to set the timeout for.
     * @param stateDef - The state definition for the state.
     */
    function setStateTimeout(state, stateDef) {
        if (stateDef.onTimeout) {
            const delay = stateDef.onTimeout.delay(context);
            timeoutIds[state] = setTimeout(() => {
                stateDef.onTimeout.action({ context, state, send });
            }, delay);
        }
    }
    /**
     * Clears the timeout for the current state.
     * @param state - The state to clear the timeout for.
     */
    function clearStateTimeout(state) {
        if (timeoutIds[state]) {
            clearTimeout(timeoutIds[state]);
            delete timeoutIds[state];
        }
    }
    /**
     * Subscribes a callback function to be notified of state changes.
     * @param callback - The function to be called when the state changes.
     */
    function subscribe(callback) {
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
    function fromJSON(json) {
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
function initializeState(states) {
    const initialStates = Object.entries(states).filter(([_, stateDef]) => stateDef === null || stateDef === void 0 ? void 0 : stateDef.isInitial);
    if (initialStates.length === 0) {
        throw new Error("No initial state defined");
    }
    if (initialStates.length === 1) {
        return initialStates[0][0];
    }
    return initialStates.map(([state, _]) => state);
}
/**
 * Flattens a potentially nested state into an array of string states.
 * @template S - The type of states in the machine.
 * @param state - The state or array of states to flatten.
 * @returns An array of flattened states.
 */
function flattenState(state) {
    if (typeof state === 'string') {
        return [state];
    }
    return state.flatMap(s => flattenState(s));
}
//# sourceMappingURL=stateMachine.js.map