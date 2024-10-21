// src/examples/trafficLight.ts

import { createStateMachine, TransitionMap } from '../index';
import readline from 'readline';

// Define possible states for the traffic light
type TrafficLightState =
    | 'stop'
    | 'prepareToGo'
    | 'go'
    | 'waitingToStop'
    | 'prepareToStop';

// Define events that trigger state transitions
type TrafficLightEvent =
    | { type: 'NEXT' }
    | { type: 'STOP' };

// Initialize the context with default light states and timeout durations
const trafficLightContext = {
    traffic: { red: false, amber: false, green: false },
    pedestrian: { red: true, green: false },
    timeoutPeriods: {
        stop: 5000,          // 'stop' state duration in milliseconds
        prepareToGo: 2000,   // 'prepareToGo' state duration
        waitingToStop: 3000, // 'waitingToStop' state duration
        readyToStop: 2000,   // 'readyToStop' state duration
    },
};

type TrafficLightContext = typeof trafficLightContext;

// Define state transitions for the traffic light
const trafficLightTransitions: TransitionMap<TrafficLightState, TrafficLightEvent, TrafficLightContext> = {
    stop: {
        onEntry: ({ context }) => {
            Object.assign(context, {
                traffic: { red: true, amber: false, green: false },
                pedestrian: { red: false, green: true },
            });
        },
        onTimeout: {
            delay: (context) => context.timeoutPeriods.stop,
            action: ({ send }) => send({ type: 'NEXT' }),
        },
        on: {
            NEXT: { target: 'prepareToGo' },
        }
    },
    prepareToGo: {
        isInitial: true,
        onEntry: ({ context }) => {
            Object.assign(context, {
                traffic: { red: true, amber: true, green: false },
                pedestrian: { red: true, green: false },
            });
        },
        onTimeout: {
            delay: (context) => context.timeoutPeriods.prepareToGo,
            action: ({ send }) => send({ type: 'NEXT' }),
        },
        on: {
            NEXT: { target: 'go' },
        },
    },
    go: {
        onEntry: ({ context }) => {
            Object.assign(context, {
                traffic: { red: false, amber: false, green: true },
                pedestrian: { red: true, green: false },
            });
        },
        on: {
            STOP: { target: 'waitingToStop' },
            NEXT: { target: 'waitingToStop' },
        },
    },
    waitingToStop: {
        onEntry: ({ context }) => {
            Object.assign(context, {
                traffic: { red: false, amber: true, green: false },
                pedestrian: { red: true, green: false },
            });
        },
        onTimeout: {
            delay: (context) => context.timeoutPeriods.readyToStop,
            action: ({ send }) => send({ type: 'NEXT' }),
        },
        on: {
            NEXT: { target: 'prepareToStop' },
        },
    },
    prepareToStop: {
        onEntry: ({ context }) => {
            Object.assign(context, {
                traffic: { red: true, amber: false, green: false },
                pedestrian: { red: true, green: false },
            });
        },
        onTimeout: {
            delay: (context) => context.timeoutPeriods.stop,
            action: ({ send }) => send({ type: 'NEXT' }),
        },
        on: {
            NEXT: { target: 'stop' },
        },
    },
};

// Create the state machine with initial state and context
const trafficLightMachine = createStateMachine({
    context: trafficLightContext,
    states: trafficLightTransitions,
});

// Log current status of traffic and pedestrian lights on state change
trafficLightMachine.subscribe((state, context) => {
    const trafficLight = Object.entries(context.traffic)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(' + ');
    const pedestrianLight = Object.entries(context.pedestrian)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(' + ');
    console.log(`${state} (Traffic: ${trafficLight}, Pedestrian: ${pedestrianLight})`);
});

// Setup readline for user input to control the traffic light
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    } else if (key.name === 'space') {
        console.log('Space pressed. Triggering STOP event.');
        trafficLightMachine.send({ type: 'STOP' });
    }
});

// Display welcome message and instructions
console.log('Welcome to the Traffic Light State Machine Simulation!');
console.log('Instructions:');
console.log('- The traffic light will cycle through its states automatically.');
console.log('- Press SPACE to trigger the STOP event.');
console.log('- Press CTRL+C to exit.\n');

trafficLightMachine.start();
