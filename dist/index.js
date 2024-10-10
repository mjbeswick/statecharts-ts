"use strict";
// src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createState = createState;
function createState(definition) {
    var _a;
    if (definition.states) {
        // Create state machine
        const stateMachine = {
            send: () => { },
            setState: () => { },
            value: null, // Temporarily set to null, will be initialized
            context: definition.context,
        };
        const states = definition.states;
        // Assign send methods of states to the state machine's send
        for (const key in states) {
            const state = states[key];
            state.send = (event) => stateMachine.send(event);
        }
        // Implement setState
        stateMachine.setState = (state) => {
            stateMachine.value = state;
            if (state.action) {
                state.action(stateMachine.context);
            }
            if (state.after) {
                const delay = typeof state.after.delay === 'function'
                    ? state.after.delay(stateMachine.context)
                    : state.after.delay;
                setTimeout(() => {
                    const target = state.after.target();
                    stateMachine.setState(target);
                }, delay);
            }
        };
        // Implement send
        stateMachine.send = (event) => {
            const currentState = stateMachine.value;
            if (currentState && currentState.on && currentState.on[event]) {
                const target = currentState.on[event].target();
                stateMachine.setState(target);
            }
            else {
                console.warn(`No transition defined for event '${event}' in state '${currentState}'.`);
            }
        };
        // Initialize with initial state
        if (definition.initial) {
            stateMachine.setState(definition.initial);
        }
        else {
            throw new Error("Initial state must be defined when 'states' are provided.");
        }
        return stateMachine;
    }
    else {
        // Create single state
        const state = {
            send: (event) => { },
            context: definition.context, // Now allowed
        };
        // Assign action, after, on if present
        if (definition.action) {
            state.action = definition.action;
        }
        if (definition.after) {
            state.after = definition.after;
        }
        if (definition.on) {
            state.on = definition.on;
        }
        // Implement send
        state.send = (event) => {
            var _a;
            if (state.on && state.on[event]) {
                const target = state.on[event].target();
                (_a = state.setState) === null || _a === void 0 ? void 0 : _a.call(state, target);
            }
        };
        // Implement setState
        state.setState = (newState) => {
            if (newState.action) {
                newState.action(newState.context);
            }
            if (newState.after) {
                const delay = typeof newState.after.delay === 'function'
                    ? newState.after.delay(newState.context)
                    : newState.after.delay;
                setTimeout(() => {
                    var _a;
                    const target = newState.after.target();
                    (_a = newState.setState) === null || _a === void 0 ? void 0 : _a.call(newState, target);
                }, delay);
            }
            // Note: Do NOT set state.value to avoid circular references
        };
        // Initialize state
        if (definition.initial) {
            (_a = state.setState) === null || _a === void 0 ? void 0 : _a.call(state, definition.initial);
        }
        return state;
    }
}
//# sourceMappingURL=index.js.map