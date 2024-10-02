# statecharts-ts

![License](https://img.shields.io/npm/l/statecharts-ts)
![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)

`statecharts-ts` is a TypeScript library that provides a flexible and powerful way to create and manage state machines (statecharts) in your applications. Inspired by the [Statecharts](https://en.wikipedia.org/wiki/State_machine#Statecharts) formalism introduced by David Harel, this library allows you to model complex behaviors with ease, leveraging TypeScript's type safety and modern JavaScript features.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Defining States, Events, and Context](#defining-states-events-and-context)
  - [Creating a State Machine](#creating-a-state-machine)
  - [Handling Transitions](#handling-transitions)
  - [Subscribing to State Changes](#subscribing-to-state-changes)
- [Examples](#examples)
  - [Media Player State Machine](#media-player-state-machine)
  - [Casio F-91W Quartz Watch Model](#casio-f-91w-quartz-watch-model)
- [API Reference](#api-reference)
- [Statecharts Resources](#statecharts-resources)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Statecharts extend finite state machines with concepts such as hierarchy, concurrency, and orthogonality, enabling the modeling of complex systems in a manageable and scalable way. They are widely used in various domains, including user interface development, game development, robotics, and more.

The `statecharts-ts` library brings these powerful concepts to TypeScript, allowing developers to define robust and maintainable state machines with type safety and intuitive syntax.

## Features

- **Type Safety**: Leverage TypeScript's type system to define states, events, and context with precision.
- **Hierarchical States**: Organize states in a nested structure for better manageability.
- **Parallel States**: Support for concurrent states to model independent state machines running in parallel.
- **Transitions with Actions**: Define actions that execute during state transitions to modify context or trigger side effects.
- **Event Handling**: Send events to trigger state transitions.
- **Subscription Mechanism**: Subscribe to state changes to react to transitions in your application.

<!--
## Installation (coming soon!)

You can install `statecharts-ts` via [npm](https://www.npmjs.com/):

```bash
npm install statecharts-ts
```

Or using [yarn](https://yarnpkg.com/):

```bash
yarn add statecharts-ts
```
-->

## Getting Started

### Defining States, Events, and Context

Start by defining the states, events, and context for your state machine using TypeScript's type system.

```typescript
// Define possible states as a string union
type TrafficLightState = 'red' | 'green' | 'yellow';

// Define events with optional data
type TrafficLightEvent =
  | { type: 'TIMER' }
  | { type: 'EMERGENCY' };

// Define the context of the state machine
interface TrafficLightContext {
  emergency?: boolean;
}
```

### Creating a State Machine

Use the `Machine` class to create a state machine by providing a state definition, initial context, and initial states.

```typescript
import { Machine, StateDefinition } from 'statecharts-ts';

// Define the state machine structure
const trafficLightDefinition: StateDefinition<TrafficLightState, TrafficLightEvent, TrafficLightContext> = {
  initial: 'red',
  states: {
    red: {
      transitions: {
        TIMER: { target: 'green' },
        EMERGENCY: { target: 'red', action: (context) => { context.emergency = true; } },
      },
    },
    green: {
      transitions: {
        TIMER: { target: 'yellow' },
        EMERGENCY: { target: 'red', action: (context) => { context.emergency = true; } },
      },
    },
    yellow: {
      transitions: {
        TIMER: { target: 'red' },
        EMERGENCY: { target: 'red', action: (context) => { context.emergency = true; } },
      },
    },
  },
};

// Initialize the context
const trafficLightContext: TrafficLightContext = {};

// Create the state machine instance
const trafficLightMachine = new Machine<TrafficLightState, TrafficLightEvent, TrafficLightContext>(
  trafficLightDefinition,
  trafficLightContext,
  [trafficLightDefinition.initial!]
);
```

### Handling Transitions

Trigger state transitions by sending events to the state machine.

```typescript
// Subscribe to state transitions
trafficLightMachine.onTransition((states) => {
  console.log('Current States:', states);
  console.log('Current Context:', trafficLightMachine.getContext());
});

// Send events to transition states
trafficLightMachine.send({ type: 'TIMER' });      // red -> green
trafficLightMachine.send({ type: 'TIMER' });      // green -> yellow
trafficLightMachine.send({ type: 'EMERGENCY' });  // yellow -> red (with emergency)
```

### Subscribing to State Changes

Use the `onTransition` method to react to state changes.

```typescript
trafficLightMachine.onTransition((states) => {
  console.log('Transitioned to states:', states);
});

// To unsubscribe
const callback = (states: TrafficLightState[]) => {
  console.log('Another subscriber:', states);
};
trafficLightMachine.onTransition(callback);
trafficLightMachine.offTransition(callback);
```

## Examples

### Media Player State Machine

The following example demonstrates a media player state machine with parallel and nested states, including playback and network states.

```typescript
import { Machine, StateDefinition } from 'statecharts-ts';

// Define states, events, and context
type MediaPlayerState =
  | 'playback.stopped'
  | 'playback.playing'
  | 'playback.paused'
  | 'network.connected'
  | 'network.disconnected';

type MediaPlayerEvent =
  | { type: 'PLAY'; data?: { trackId: string; trackName: string } }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'CONNECT'; data?: { connectionType: string } }
  | { type: 'DISCONNECT' };

interface MediaPlayerContext {
  currentTrackId?: string;
  currentTrackName?: string;
  connectionType?: string;
}

// Define the state machine
const mediaPlayerDefinition: StateDefinition<MediaPlayerState, MediaPlayerEvent, MediaPlayerContext> = {
  parallel: true,
  states: {
    playback: {
      initial: 'stopped',
      states: {
        stopped: {
          transitions: {
            PLAY: {
              target: 'playback.playing',
              action: (context, event) => {
                if (event.type === 'PLAY' && event.data) {
                  context.currentTrackId = event.data.trackId;
                  context.currentTrackName = event.data.trackName;
                }
              },
            },
          },
        },
        playing: {
          transitions: {
            PAUSE: { target: 'playback.paused' },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
              },
            },
          },
        },
        paused: {
          transitions: {
            PLAY: { target: 'playback.playing' },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
              },
            },
          },
        },
      },
    },
    network: {
      initial: 'disconnected',
      states: {
        disconnected: {
          transitions: {
            CONNECT: {
              target: 'network.connected',
              action: (context, event) => {
                if (event.type === 'CONNECT' && event.data) {
                  context.connectionType = event.data.connectionType;
                }
              },
            },
          },
        },
        connected: {
          transitions: {
            DISCONNECT: {
              target: 'network.disconnected',
              action: (context) => {
                context.connectionType = undefined;
              },
            },
          },
        },
      },
    },
  },
};

// Initialize context
const mediaPlayerContext: MediaPlayerContext = {};

// Create the state machine instance
const mediaPlayerMachine = new Machine<MediaPlayerState, MediaPlayerEvent, MediaPlayerContext>(
  mediaPlayerDefinition,
  mediaPlayerContext,
  ['playback', 'network']
);

// Subscribe to transitions
mediaPlayerMachine.onTransition((states) => {
  console.log('Current States:', states);
  console.log('Context:', mediaPlayerMachine.getContext());
});

// Trigger events
mediaPlayerMachine.send({ type: 'CONNECT', data: { connectionType: 'WiFi' } });
mediaPlayerMachine.send({ type: 'PLAY', data: { trackId: '123', trackName: 'My Song' } });
mediaPlayerMachine.send({ type: 'PAUSE' });
mediaPlayerMachine.send({ type: 'STOP' });
mediaPlayerMachine.send({ type: 'DISCONNECT' });
```

### Casio F-91W Quartz Watch Model

Modeling the classic Casio F-91W quartz watch with modes such as Timekeeping, Alarm, Stopwatch, and Time Setting.

```typescript
import { Machine, StateDefinition } from 'statecharts-ts';

// Define events
type WatchEvent =
  | { type: 'PRESS_A' }
  | { type: 'PRESS_B' }
  | { type: 'PRESS_C' }
  | { type: 'LONG_PRESS_C' };

// Define context
interface WatchContext {
  time: Date;
  alarmTime: Date;
  stopwatchTime: number;
  stopwatchRunning: boolean;
  alarmEnabled: boolean;
  chimeEnabled: boolean;
}

// Define the state machine
const watchMachineDefinition: StateDefinition<WatchEvent, WatchContext, WatchContext> = {
  initial: 'timekeeping',
  states: {
    timekeeping: {
      enter: (context) => {
        console.log('Entered Timekeeping Mode');
      },
      transitions: {
        PRESS_B: { target: 'alarm' },
        LONG_PRESS_C: { target: 'timeSetting' },
        PRESS_A: {
          target: 'timekeeping',
          action: () => {
            console.log('Light On');
          },
        },
      },
    },
    alarm: {
      enter: (context) => {
        console.log('Entered Alarm Mode');
      },
      transitions: {
        PRESS_B: { target: 'stopwatch' },
        PRESS_C: {
          target: 'alarm',
          action: (context) => {
            context.alarmEnabled = !context.alarmEnabled;
            console.log(`Alarm Enabled: ${context.alarmEnabled}`);
          },
        },
        PRESS_A: {
          target: 'alarm',
          action: (context) => {
            context.chimeEnabled = !context.chimeEnabled;
            console.log(`Hourly Chime Enabled: ${context.chimeEnabled}`);
          },
        },
      },
    },
    stopwatch: {
      enter: (context) => {
        console.log('Entered Stopwatch Mode');
      },
      transitions: {
        PRESS_B: { target: 'timekeeping' },
        PRESS_A: {
          target: 'stopwatch',
          action: (context) => {
            context.stopwatchRunning = !context.stopwatchRunning;
            console.log(
              `Stopwatch ${context.stopwatchRunning ? 'Started' : 'Stopped'}`
            );
          },
        },
        PRESS_C: {
          target: 'stopwatch',
          action: (context) => {
            if (!context.stopwatchRunning) {
              context.stopwatchTime = 0;
              console.log('Stopwatch Reset');
            }
          },
        },
      },
    },
    timeSetting: {
      enter: (context) => {
        console.log('Entered Time Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'timeSetting',
          action: (context) => {
            // Adjust minutes
            context.time.setMinutes(context.time.getMinutes() + 1);
            console.log(`Time Adjusted: ${context.time.toLocaleTimeString()}`);
          },
        },
        PRESS_B: { target: 'dateSetting' },
        LONG_PRESS_C: { target: 'timekeeping' },
      },
    },
    dateSetting: {
      enter: (context) => {
        console.log('Entered Date Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'dateSetting',
          action: (context) => {
            // Adjust day
            context.time.setDate(context.time.getDate() + 1);
            console.log(`Date Adjusted: ${context.time.toLocaleDateString()}`);
          },
        },
        PRESS_B: { target: 'timeSetting' },
        LONG_PRESS_C: { target: 'timekeeping' },
      },
    },
  },
};

// Initialize context
const watchContext: WatchContext = {
  time: new Date(),
  alarmTime: new Date(new Date().setHours(6, 0, 0)), // Default alarm at 6:00 AM
  stopwatchTime: 0,
  stopwatchRunning: false,
  alarmEnabled: false,
  chimeEnabled: false,
};

// Create the state machine instance
const watchMachine = new Machine<WatchEvent, WatchContext, WatchContext>(
  watchMachineDefinition,
  watchContext,
  [watchMachineDefinition.initial!]
);

// Subscribe to transitions
watchMachine.onTransition((states) => {
  console.log('Current State:', states[0]);
});

// Simulate button presses
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 2000); // Switch to Alarm Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 4000); // Toggle Alarm
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 6000); // Toggle Hourly Chime
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 8000); // Switch to Stopwatch Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 10000); // Start Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_A' }), 15000); // Stop Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 16000); // Reset Stopwatch
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 18000); // Switch to Timekeeping Mode
setTimeout(() => watchMachine.send({ type: 'LONG_PRESS_C' }), 20000); // Enter Time Setting Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 22000); // Adjust Time
setTimeout(() => watchMachine.send({ type: 'PRESS_B' }), 24000); // Switch to Date Setting Mode
setTimeout(() => watchMachine.send({ type: 'PRESS_C' }), 26000); // Adjust Date
setTimeout(() => watchMachine.send({ type: 'LONG_PRESS_C' }), 28000); // Exit Time Setting Mode
```

## API Reference

### `Machine` Class

A generic state machine class for creating and managing statecharts.

#### Type Parameters

- `TState`: A string union representing state names.
- `TEvent`: A type for events, which must include a `type` property and can have additional data.
- `TContext`: A type representing the state machine's context or data.

#### Constructor

```typescript
new Machine<TState, TEvent, TContext>(
  stateDefinition: StateDefinition<TState, TEvent, TContext>,
  context: TContext,
  initialStates: TState[]
)
```

- **`stateDefinition`**: Defines the states, transitions, and behavior of the state machine.
- **`context`**: The initial context or data for the state machine.
- **`initialStates`**: An array of initial states to enter when the machine is instantiated.

#### Methods

- **`send(event: TEvent): void`**  
  Triggers a transition based on the current state and the event.

- **`getState(): TState[]`**  
  Returns the current state(s) of the machine.

- **`getContext(): TContext`**  
  Returns the current context of the machine.

- **`onTransition(callback: (state: TState[]) => void): void`**  
  Subscribes to state transitions with a callback function.

- **`offTransition(callback: (state: TState[]) => void): void`**  
  Unsubscribes a previously subscribed callback from state transitions.

### `StateDefinition` Type

Defines the structure and behavior of states within the state machine.

```typescript
type StateDefinition<TState extends string, TEvent, TContext> = {
  initial?: TState;
  parallel?: boolean;
  states?: Record<TState, StateDefinition<TState, TEvent, TContext>>;
  transitions?: Record<string, Transition<TState, TEvent, TContext>>;
  enter?: (context: TContext, send: (event: TEvent) => void) => void;
  after?: Record<number, Transition<TState, TEvent, TContext>>;
};
```

### `Transition` Type

Defines a state transition.

```typescript
type Transition<TState extends string, TEvent, TContext> = {
  target: TState | TState[];
  action?: (context: TContext, event: TEvent) => void;
};
```

## Statecharts Resources

- [Statecharts on Wikipedia](https://en.wikipedia.org/wiki/State_machine#Statecharts)
- [Statecharts in Software Engineering](https://www.cs.cmu.edu/~mleone/courses/15-817-f11/slides/statecharts.pdf)
- [xstate](https://xstate.js.org/docs/) - A popular state machine library for JavaScript/TypeScript.
- [David Harel's Original Paper on Statecharts](https://www.cs.tau.ac.il/~stoledo/courses/2003_1/statechart.pdf)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the [MIT License](LICENSE).
