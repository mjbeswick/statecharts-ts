"use strict";
// src/stateMachine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStateMachine = createStateMachine;
function createStateMachine(config) {
    let currentState = initializeState(config.states);
    let context = config.context;
    let exitFn = undefined;
    const subscribers = [];
    let timeoutIds = {};
    function start() {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => enterState(state));
        }
        else {
            enterState(currentState);
        }
        notifySubscribers();
    }
    function enterState(state) {
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
    function send(event) {
        if (Array.isArray(currentState)) {
            currentState.forEach(state => handleSingleStateTransition(state, event));
        }
        else {
            handleSingleStateTransition(currentState, event);
        }
        notifySubscribers();
    }
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
    function setStateTimeout(state, stateDef) {
        if (stateDef.onTimeout) {
            const delay = stateDef.onTimeout.delay(context);
            timeoutIds[state] = setTimeout(() => {
                stateDef.onTimeout.action({ context, state, send });
            }, delay);
        }
    }
    function clearStateTimeout(state) {
        if (timeoutIds[state]) {
            clearTimeout(timeoutIds[state]);
            delete timeoutIds[state];
        }
    }
    function subscribe(callback) {
        subscribers.push(callback);
    }
    function notifySubscribers() {
        for (const subscriber of subscribers) {
            subscriber(currentState, context);
        }
    }
    function toJSON() {
        return JSON.stringify({ state: currentState, context });
    }
    function fromJSON(json) {
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
function flattenState(state) {
    if (typeof state === 'string') {
        return [state];
    }
    return state.flatMap(s => flattenState(s));
}
//# sourceMappingURL=stateMachine.js.map