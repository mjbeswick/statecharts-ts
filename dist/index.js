"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createState = createState;
function createState(definition) {
    var _a;
    const state = {
        send: () => { }, // Placeholder, will be initialized later
        setState: () => { }, // Placeholder, will be initialized later
        context: definition.context,
        action: definition.action,
        after: definition.after,
        on: definition.on,
        states: definition.states,
        value: undefined,
    };
    if (definition.states) {
        // State machine case
        state.value = (_a = definition.value) !== null && _a !== void 0 ? _a : null;
        // Set state method to change current state in a state machine
        state.setState = (newState) => {
            state.value = newState;
            if (newState.action)
                newState.action(state.context);
            if (newState.after) {
                const delay = typeof newState.after.delay === 'function'
                    ? newState.after.delay(state.context)
                    : newState.after.delay;
                setTimeout(() => state.setState(newState.after.target()), delay);
            }
        };
        state.send = (event) => {
            const currentState = state.value;
            if ((currentState === null || currentState === void 0 ? void 0 : currentState.on) && currentState.on[event]) {
                state.setState(currentState.on[event].target());
            }
            else {
                console.warn(`No transition defined for event '${String(event)}'.`);
            }
        };
        if (!definition.value) {
            throw new Error("Initial state must be defined when 'states' are provided.");
        }
        else {
            state.setState(definition.value);
        }
    }
    else {
        // Single state case
        state.setState = (newState) => {
            if (newState.action)
                newState.action(state.context);
            if (newState.after) {
                const delay = typeof newState.after.delay === 'function'
                    ? newState.after.delay(state.context)
                    : newState.after.delay;
                setTimeout(() => state.setState(newState.after.target()), delay);
            }
        };
        state.send = (event) => {
            if (state.on && state.on[event]) {
                state.setState(state.on[event].target());
            }
        };
    }
    return state;
}
//# sourceMappingURL=index.js.map