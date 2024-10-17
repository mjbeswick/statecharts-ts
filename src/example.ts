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

export type TrafficLightEvent =
    | { type: 'INITIALISED' }
    | { type: 'NEXT' }
    | { type: 'CROSS' };

// TrafficLightMachine Class Extending AbstractStateMachine
export class TrafficLightMachine extends AbstractStateMachine<TrafficLightState, TrafficLightEvent, any> {
    protected currentState: TrafficLightState = 'initialising';

    protected context = {
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

    transitionMap: TransitionMap<TrafficLightState, TrafficLightEvent, typeof this.context> = {
        initialising: {
            INITIALISED: {
                target: 'stop',
                enter: (context) => {
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
                enter: (context) => {
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
                enter: (context) => {
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
                enter: (context) => {
                    console.log('Entering waitingToStop state... (Waiting to stop for pedestrians)');
                    setTimeout(() => this.send({ type: 'NEXT' }), context.timeoutPeriods.waitingToStop);
                },
            },
        },
        waitingToStop: {
            NEXT: {
                target: 'readyToStop',
                enter: (context) => {
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
                enter: (context) => {
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

// Uncomment to subscribe to state changes
trafficLightMachine.subscribe((state, context) => {
    console.log('State:', state, 'with context:', context);
});

console.log('Initial State:', trafficLightMachine.getState());

trafficLightMachine.send({ type: 'INITIALISED' });

// Setup readline to handle user input
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
        console.log('Exiting...');
        process.exit();
    } else if (key.name === 'space') {
        console.log('Space pressed. Triggering CROSS event.');
        trafficLightMachine.send({ type: 'CROSS' });
    }
});
