import { createStateMachine, TransitionMap } from './index';
import readline from 'readline';

// Define your states and events
type TrafficLightState =
    | 'initialising'
    | 'stop'
    | 'prepareToGo'
    | 'go'
    | 'waitingToStop'
    | 'readyToStop';

type TrafficLightEvent =
    | { type: 'INITIALISED' }
    | { type: 'NEXT' }
    | { type: 'CROSS' };

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

type TrafficLightContext = typeof trafficLightContext;

// Define your transition map
const trafficLightTransitions: TransitionMap<TrafficLightState, TrafficLightEvent, TrafficLightContext> = {
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
        CROSS: {
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
const trafficLightMachine = createStateMachine({
    initialState: 'initialising' as TrafficLightState,
    context: trafficLightContext,
    transitionMap: trafficLightTransitions,
});

// Subscribe to state changes
trafficLightMachine.subscribe((state, context) => {
    const trafficLightText = Object.entries(context.traffic).map(([key, value]) => `${key}: ${value}`).join(', ');
    const pedestrianLightText = Object.entries(context.pedestrian).map(([key, value]) => `${key}: ${value}`).join(', ');
    console.log(`actioning state: ${state}... (Traffic Light: ${trafficLightText}, Pedestrian Light: ${pedestrianLightText})`);
    console.log('State:', state, 'with context:', context);
});

console.log('Initial State:', trafficLightMachine.getState());

trafficLightMachine.send({ type: 'INITIALISED' });

// Setup readline to handle user input
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    } else if (key.name === 'space') {
        console.log('Space pressed. Triggering CROSS event.');
        trafficLightMachine.send({ type: 'CROSS' });
    }
});
