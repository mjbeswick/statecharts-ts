import { AbstractStateMachine, TransitionMap } from './index';
import readline from 'readline';

// Type Definitions for Traffic Light States and Events
export type TrafficLightState =
    | 'initialising'
    | 'stop'
    | 'prepareToGo'
    | 'go'
    | 'waitingToStop'
    | 'readyToStop';

// Define TrafficLightEvent as a union of event objects
export type TrafficLightEvent =
    | { type: 'INITIALISED' }
    | { type: 'NEXT' }
    | { type: 'CROSS' };

// Define Context Interface
export interface TrafficLightContext {
    trafficLight: string;
    traffic: { red: boolean; amber: boolean; green: boolean };
    pedestrian: { red: boolean; green: boolean };
    timeoutPeriods: {
        stop: number;
        prepareToGo: number;
        waitingToStop: number;
        readyToStop: number;
    };
}

// TrafficLightMachine Class Extending AbstractStateMachine
export class TrafficLightMachine extends AbstractStateMachine<
    TrafficLightState,
    TrafficLightEvent,
    TrafficLightContext
> {
    protected currentState: TrafficLightState = 'initialising';

    protected context: TrafficLightContext = {
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

    protected transitionMap: TransitionMap<TrafficLightState, TrafficLightEvent, TrafficLightContext> = {
        initialising: {
            INITIALISED: {
                target: 'stop',
                enter: (context: TrafficLightContext) => {
                    Object.assign(context, {
                        trafficLight: 'stop',
                        traffic: { red: true, amber: false, green: false },
                        pedestrian: { red: true, green: false },
                    });
                    console.log('Entering stop state... (Red Light)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
                },
            },
        },
        stop: {
            NEXT: {
                target: 'prepareToGo',
                enter: (context: TrafficLightContext) => {
                    Object.assign(context, {
                        trafficLight: 'prepareToGo',
                        traffic: { red: true, amber: true, green: false },
                        pedestrian: { red: true, green: false },
                    });
                    console.log('Entering prepareToGo state... (Red + Amber Light)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.prepareToGo);
                },
            },
        },
        prepareToGo: {
            NEXT: {
                target: 'go',
                enter: (context: TrafficLightContext) => {
                    Object.assign(context, {
                        trafficLight: 'go',
                        traffic: { red: false, amber: false, green: true },
                        pedestrian: { red: true, green: false },
                    });
                    console.log('Entering go state... (Green Light)');
                },
            },
        },
        go: {
            CROSS: {
                target: 'waitingToStop',
                enter: (context: TrafficLightContext) => {
                    console.log('Entering waitingToStop state... (Waiting to stop for pedestrians)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.waitingToStop);
                },
            },
        },
        waitingToStop: {
            NEXT: {
                target: 'readyToStop',
                enter: (context: TrafficLightContext) => {
                    Object.assign(context, {
                        trafficLight: 'readyToStop',
                        traffic: { red: false, amber: true, green: false },
                        pedestrian: { red: true, green: false },
                    });
                    console.log('Entering readyToStop state... (Amber Light)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.readyToStop);
                },
            },
        },
        readyToStop: {
            NEXT: {
                target: 'stop',
                enter: (context: TrafficLightContext) => {
                    Object.assign(context, {
                        trafficLight: 'stop',
                        traffic: { red: true, amber: false, green: false },
                        pedestrian: { red: true, green: false },
                    });
                    console.log('Entering stop state... (Red Light)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.stop);
                },
            },
        },
    };
}

// Example usage
const trafficLightMachine = new TrafficLightMachine();

// Subscribe to state changes
trafficLightMachine.subscribe((state: TrafficLightState, context: TrafficLightContext) => {
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
