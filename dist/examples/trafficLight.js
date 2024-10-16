"use strict";
// src/examples/trafficLight.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const readline_1 = __importDefault(require("readline"));
// Define your context
const trafficLightContext = {
    trafficLight: 'initialising',
    traffic: { red: false, amber: false, green: false },
    pedestrian: { red: true, green: false },
    timeoutPeriods: {
        stop: 5000,
        prepareToGo: 2000,
        waitingToStop: 3000,
        readyToStop: 2000,
    },
};
// Define your transition map
const trafficLightTransitions = {
    initialising: {
        INITIALISED: {
            target: 'stop',
            action: (context) => {
                Object.assign(context, {
                    trafficLight: 'stop',
                    traffic: { red: true, amber: false, green: false },
                    pedestrian: { red: true, green: false },
                });
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
            },
        },
    },
    stop: {
        NEXT: {
            target: 'prepareToGo',
            action: (context) => {
                Object.assign(context, {
                    trafficLight: 'prepareToGo',
                    traffic: { red: true, amber: true, green: false },
                    pedestrian: { red: true, green: false },
                });
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.prepareToGo);
            },
        },
    },
    prepareToGo: {
        NEXT: {
            target: 'go',
            action: (context) => {
                Object.assign(context, {
                    trafficLight: 'go',
                    traffic: { red: false, amber: false, green: true },
                    pedestrian: { red: true, green: false },
                });
            },
        },
    },
    go: {
        STOP: {
            target: 'waitingToStop',
            action: (context) => {
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.waitingToStop);
            },
        },
    },
    waitingToStop: {
        NEXT: {
            target: 'readyToStop',
            action: (context) => {
                Object.assign(context, {
                    trafficLight: 'readyToStop',
                    traffic: { red: false, amber: true, green: false },
                    pedestrian: { red: true, green: false },
                });
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.readyToStop);
            },
        },
    },
    readyToStop: {
        NEXT: {
            target: 'stop',
            action: (context) => {
                Object.assign(context, {
                    trafficLight: 'stop',
                    traffic: { red: true, amber: false, green: false },
                    pedestrian: { red: true, green: false },
                });
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
            },
        },
    },
};
// Create your state machine instance
const trafficLightMachine = (0, index_1.createStateMachine)({
    initialState: 'initialising',
    context: trafficLightContext,
    transitionMap: trafficLightTransitions,
});
// Subscribe to state changes
trafficLightMachine.subscribe((state, context) => {
    const trafficLight = Object.entries(context.traffic).filter(([_, value]) => value).map(([key]) => key).join(' + ');
    const pedestrianLight = Object.entries(context.pedestrian).filter(([_, value]) => value).map(([key]) => key).join(' + ');
    console.log(`${state} (Traffic: ${trafficLight}, Pedestrian: ${pedestrianLight})`);
});
// Setup readline to handle user input
readline_1.default.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    }
    else if (key.name === 'space') {
        console.log('Space pressed. Triggering STOP event.');
        trafficLightMachine.send({ type: 'STOP' });
    }
});
console.log('Press SPACE to trigger STOP event. Press CTRL+C to exit.\n');
trafficLightMachine.send({ type: 'INITIALISED' });
//# sourceMappingURL=trafficLight.js.map