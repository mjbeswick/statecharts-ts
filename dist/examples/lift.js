"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stateMachine_1 = require("../stateMachine");
const readline_1 = __importDefault(require("readline"));
// Define your context
const liftContext = {
    currentFloor: 1,
    targetFloor: 1,
    weightExceeded: false,
    doorBlocked: false,
    emergencyActive: false,
    floorQueue: [], // Queue to store requested floors
};
// Define your transition map
const liftTransitions = {
    operational: {
        FLOOR_REQUEST: {
            target: 'requestPending',
            action: (context, event) => {
                if (!context.floorQueue.includes(event.floor)) {
                    context.floorQueue.push(event.floor);
                    context.targetFloor = event.floor;
                    console.log(`Floor ${event.floor} requested. Target floor set to ${context.targetFloor}.`);
                }
            },
        },
        requestPending: {
            target: 'doorOpening',
            action: (context) => {
                if (context.floorQueue.length > 0) {
                    context.targetFloor = context.floorQueue.shift();
                    console.log(`Target floor set to ${context.targetFloor}. Moving to floor ${context.targetFloor}.`);
                }
            },
        },
        doorOpening: {
            target: 'doorOpen',
            action: (context) => {
                setTimeout(() => {
                    console.log('Doors opened.');
                    liftMachine.send({ type: 'DOOR_OPENED' });
                }, 3000); // Simulate door opening time
            },
        },
        doorOpen: {
            target: 'doorClosing',
            action: () => {
                setTimeout(() => {
                    console.log('Doors closing...');
                    liftMachine.send({ type: 'DOOR_CLOSING' });
                }, 5000); // Wait 5 seconds before closing doors
            },
        },
        doorClosing: {
            target: (context) => context.currentFloor < context.targetFloor ? 'movingUp' : 'movingDown',
            action: () => {
                setTimeout(() => {
                    console.log('Doors closed. Moving to target floor...');
                    liftMachine.send({ type: 'MOVE_TO_TARGET' });
                }, 3000); // Simulate door closing time
            },
        },
        movingUp: {
            target: 'idle',
            action: (context) => {
                context.currentFloor = context.targetFloor;
                console.log(`Arrived at floor ${context.targetFloor}.`);
            },
        },
        movingDown: {
            target: 'idle',
            action: (context) => {
                context.currentFloor = context.targetFloor;
                console.log(`Arrived at floor ${context.targetFloor}.`);
            },
        },
        idle: {
            FLOOR_REQUEST: {
                target: 'requestPending',
                action: (context, event) => {
                    if (!context.floorQueue.includes(event.floor)) {
                        context.floorQueue.push(event.floor);
                        console.log(`Floor ${event.floor} requested.`);
                    }
                },
            },
        },
        DOOR_BLOCKED: {
            target: 'doorOpening',
            action: () => {
                console.log('Door blocked, reopening...');
                // Logic to handle door blocked
            },
        },
        WEIGHT_EXCEEDED: {
            target: 'idle',
            action: () => {
                console.log('Weight exceeded, cannot move...');
                // Logic to handle weight exceeded
            },
        },
    },
    maintenance: {
        MAINTENANCE_MODE_ENGAGED: {
            target: 'operational',
            action: () => {
                console.log('Exiting maintenance mode...');
                // Logic for maintenance mode
            },
        },
    },
    emergency: {
        EMERGENCY_TRIGGER: {
            target: 'emergency',
            action: () => {
                console.log('Emergency triggered!');
                // Logic for emergency handling
            },
        },
        RESOLVE_EMERGENCY: {
            target: 'operational',
            action: () => {
                console.log('Resolving emergency...');
                // Logic to resolve emergency
            },
        },
    },
};
// Create your state machine instance with the strongly typed context
const liftMachine = (0, stateMachine_1.createStateMachine)({
    initialState: 'idle',
    context: liftContext,
    transitionMap: liftTransitions,
});
// Subscribe to state changes
liftMachine.subscribe((state, context) => {
    console.log(`Current state: ${state}, Current floor: ${context.currentFloor}`);
});
// Create an interface to read from stdin
readline_1.default.createInterface({
    input: process.stdin,
    output: undefined, // Suppress keypress echo by setting output to undefined
    terminal: true // Enable raw mode for keypress capture
});
// Set the input to raw mode to capture keypresses
process.stdin.setRawMode(true);
// Listen for keypress events
process.stdin.on('keypress', (_, key) => {
    // Exit the process if Ctrl+C is pressed
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    }
    // Handle floor requests for floors 1 to 5
    else if (key.name >= '1' && key.name <= '5') {
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
console.log("Welcome to the Lift State Machine Simulation!");
console.log("Instructions:");
console.log("Press 1-5 to request a floor.");
console.log("Press 'b' to simulate a door blocked event.");
console.log("Press 'w' to simulate a weight exceeded event.");
console.log("Press 'e' to trigger an emergency.");
console.log("Press 'm' to engage maintenance mode.");
console.log("Press 'r' to resolve an emergency.");
console.log("Press Ctrl+C to exit.");
//# sourceMappingURL=lift.js.map