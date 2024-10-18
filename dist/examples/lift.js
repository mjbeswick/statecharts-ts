"use strict";
// src/examples/lift.ts
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
// Define your context
const liftContext = {
    currentFloor: 1,
    targetFloor: 1,
    weightExceeded: false,
    doorBlocked: false,
    emergencyActive: false,
};
// Define your transition map
const liftTransitions = {
    operational: {
        FLOOR_REQUEST: {
            target: 'movingUp', // Simplified for example purposes
            action: (context, event) => {
                // TypeScript should automatically infer event as { type: 'FLOOR_REQUEST'; floor: number }
                context.targetFloor = event.floor;
                console.log('Handling floor request...');
                // Logic to handle floor request
            },
        },
        DOOR_BLOCKED: {
            target: 'doorOpening',
            action: (context) => {
                console.log('Door blocked, reopening...');
                // Logic to handle door blocked
            },
        },
        WEIGHT_EXCEEDED: {
            target: 'idle',
            action: (context) => {
                console.log('Weight exceeded, cannot move...');
                // Logic to handle weight exceeded
            },
        },
    },
    maintenance: {
        MAINTENANCE_MODE_ENGAGED: {
            target: 'manualIdle',
            action: (context) => {
                console.log('Entering maintenance mode...');
                // Logic for maintenance mode
            },
        },
    },
    emergency: {
        EMERGENCY_TRIGGER: {
            target: 'alarmOn',
            action: (context) => {
                console.log('Emergency triggered!');
                // Logic for emergency handling
            },
        },
        RESOLVE_EMERGENCY: {
            target: 'operational',
            action: (context) => {
                console.log('Resolving emergency...');
                // Logic to resolve emergency
            },
        },
    },
};
// Create your state machine instance
const liftMachine = (0, index_1.createStateMachine)({
    initialState: 'operational',
    context: liftContext,
    transitionMap: liftTransitions,
});
// Subscribe to state changes
liftMachine.subscribe((state, context) => {
    console.log(`Current state: ${state}, Current floor: ${context.currentFloor}`);
});
process.stdin.on('keypress', (_, key) => {
    // Exit the process if Ctrl+C is pressed
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    }
    // Handle floor requests for floors 1 to 5
    else if (key.name === '1' || key.name === '2' || key.name === '3' || key.name === '4' || key.name === '5') {
        liftMachine.send({ type: 'FLOOR_REQUEST', floor: parseInt(key.name) });
    }
    // Handle door blocked event
    else if (key.name === 'b') {
        liftMachine.send({ type: 'DOOR_BLOCKED' });
    }
    // Handle weight exceeded event
    else if (key.name === 'w') {
        liftMachine.send({ type: 'WEIGHT_EXCEEDED' });
    }
    // Trigger emergency event
    else if (key.name === 'e') {
        liftMachine.send({ type: 'EMERGENCY_TRIGGER' });
    }
    // Engage maintenance mode
    else if (key.name === 'm') {
        liftMachine.send({ type: 'MAINTENANCE_MODE_ENGAGED' });
    }
    // Resolve emergency event
    else if (key.name === 'r') {
        liftMachine.send({ type: 'RESOLVE_EMERGENCY' });
    }
});
//# sourceMappingURL=lift.js.map