// src/examples/trafficLight.ts

import { createStateMachine, TransitionMap } from '../index';
import readline from 'readline';

// Define all possible states the traffic light can be in
type TrafficLightState =
    | 'initialising'
    | 'stop'
    | 'prepareToGo'
    | 'go'
    | 'waitingToStop'
    | 'readyToStop';

// Define the events that trigger state transitions
type TrafficLightEvent =
    | { type: 'INITIALISED' }
    | { type: 'NEXT' }
    | { type: 'STOP' };

// Initialize the context with default values for the traffic and pedestrian lights
const trafficLightContext = {
    trafficLight: 'initialising',
    traffic: { red: false, amber: false, green: false },
    pedestrian: { red: true, green: false },
    timeoutPeriods: {
        stop: 5000,          // Duration for the 'stop' state in milliseconds
        prepareToGo: 2000,   // Duration for the 'prepareToGo' state in milliseconds
        waitingToStop: 3000, // Duration for the 'waitingToStop' state in milliseconds
        readyToStop: 2000,   // Duration for the 'readyToStop' state in milliseconds
    },
};

type TrafficLightContext = typeof trafficLightContext;

// Define the state transition map detailing how the state machine moves between states
const trafficLightTransitions: TransitionMap<TrafficLightState, TrafficLightEvent, TrafficLightContext> = {
    // Initialising state: setup the traffic light to 'stop' and schedule the next event
    initialising: {
        INITIALISED: {
            target: 'stop',
            action: (context) => {
                // Update context to reflect the 'stop' state
                Object.assign(context, {
                    trafficLight: 'stop',
                    traffic: { red: true, amber: false, green: false },
                    pedestrian: { red: true, green: false },
                });
                // Schedule the next state transition after the stop duration
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
            },
        },
    },
    // Stop state: prepare to transition to 'prepareToGo'
    stop: {
        NEXT: {
            target: 'prepareToGo',
            action: (context) => {
                // Update context to reflect the 'prepareToGo' state
                Object.assign(context, {
                    trafficLight: 'prepareToGo',
                    traffic: { red: true, amber: true, green: false },
                    pedestrian: { red: true, green: false },
                });
                // Schedule the next state transition after the prepareToGo duration
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.prepareToGo);
            },
        },
    },
    // PrepareToGo state: transition to 'go'
    prepareToGo: {
        NEXT: {
            target: 'go',
            action: (context) => {
                // Update context to reflect the 'go' state
                Object.assign(context, {
                    trafficLight: 'go',
                    traffic: { red: false, amber: false, green: true },
                    pedestrian: { red: true, green: false },
                });
            },
        },
    },
    // Go state: listen for a STOP event to begin stopping sequence
    go: {
        STOP: {
            target: 'waitingToStop',
            action: (context) => {
                // Schedule the transition to 'readyToStop' after waitingToStop duration
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.waitingToStop);
            },
        },
    },
    // WaitingToStop state: prepare to stop the traffic light
    waitingToStop: {
        NEXT: {
            target: 'readyToStop',
            action: (context) => {
                // Update context to reflect the 'readyToStop' state
                Object.assign(context, {
                    trafficLight: 'readyToStop',
                    traffic: { red: false, amber: true, green: false },
                    pedestrian: { red: true, green: false },
                });
                // Schedule the next state transition after the readyToStop duration
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.readyToStop);
            },
        },
    },
    // ReadyToStop state: transition back to 'stop'
    readyToStop: {
        NEXT: {
            target: 'stop',
            action: (context) => {
                // Update context to reflect the 'stop' state again
                Object.assign(context, {
                    trafficLight: 'stop',
                    traffic: { red: true, amber: false, green: false },
                    pedestrian: { red: true, green: false },
                });
                // Schedule the next state transition after the stop duration
                setTimeout(() => trafficLightMachine.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
            },
        },
    },
};

// Create an instance of the state machine with the initial state and context
const trafficLightMachine = createStateMachine({
    initialState: 'initialising' as TrafficLightState,
    context: trafficLightContext,
    transitionMap: trafficLightTransitions,
});

// Subscribe to state changes to log the current status of traffic and pedestrian lights
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

// Setup readline to handle user input for controlling the traffic light
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

// Display welcome message and instructions to the user
console.log('Welcome to the Traffic Light State Machine Simulation!');
console.log('Instructions:');
console.log('- The traffic light will cycle through its states automatically.');
console.log('- Press SPACE to trigger the STOP event.');
console.log('- Press CTRL+C to exit.\n');

// Initialize the state machine by sending the INITIALISED event
trafficLightMachine.send({ type: 'INITIALISED' });
