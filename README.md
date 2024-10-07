# statecharts-ts

![License](https://img.shields.io/npm/l/statecharts-ts)
![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)

`statecharts-ts` is a TypeScript library that provides a flexible and powerful way to create and manage state machines (statecharts) in your applications. Inspired by the [Statecharts](https://statecharts.dev/) formalism introduced by David Harel, this library allows you to model complex behaviors with ease, leveraging TypeScript's type safety and modern JavaScript features.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Defining States, Events, and Context](#defining-states-events-and-context)
  - [Creating a State Machine](#creating-a-state-machine)
  - [Handling Transitions](#handling-transitions)
  - [Subscribing to State Changes](#subscribing-to-state-changes)
- [Advanced Features](#advanced-features)
  - [Guards (Conditional Transitions)](#guards-conditional-transitions)
  - [Entry and Exit Actions](#entry-and-exit-actions)
  - [Asynchronous Actions](#asynchronous-actions)
  - [Delayed Transitions with Dynamic Timing](#delayed-transitions-with-dynamic-timing)
  - [Error Handling](#error-handling)
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
- **Guards (Conditional Transitions)**: Define conditions that must be met for transitions to occur.
- **Entry and Exit Actions**: Execute actions when entering or exiting states.
- **Asynchronous Actions**: Support for asynchronous operations within actions and state entry/exit.
- **Delayed Transitions with Dynamic Timing**: Schedule transitions to occur after a delay, with timing based on context.
- **Error Handling**: Gracefully handle errors during transitions and actions.
- **Event Handling**: Send events to trigger state transitions.
- **Subscription Mechanism**: Subscribe to state changes to react to transitions in your application.
- **Serialization and Deserialization**: Save and restore the state and context of your state machines.

## Installation

You can install `statecharts-ts` via [npm](https://www.npmjs.com/):

```bash
npm install statecharts-ts
```

Or using [yarn](https://yarnpkg.com/):

```bash
yarn add statecharts-ts
```

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
const trafficLightDefinition: StateDefinition<TrafficLightEvent, TrafficLightContext> = {
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
const trafficLightMachine = new Machine<TrafficLightEvent, TrafficLightContext>(
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
await trafficLightMachine.send({ type: 'TIMER' });      // red -> green
await trafficLightMachine.send({ type: 'TIMER' });      // green -> yellow
await trafficLightMachine.send({ type: 'EMERGENCY' });  // yellow -> red (with emergency)
```

### Subscribing to State Changes

Use the `onTransition` method to react to state changes.

```typescript
trafficLightMachine.onTransition((states) => {
  console.log('Transitioned to states:', states);
});

// To unsubscribe
const callback = (states: string[]) => {
  console.log('Another subscriber:', states);
};
trafficLightMachine.onTransition(callback);
trafficLightMachine.offTransition(callback);
```

## Advanced Features

### Guards (Conditional Transitions)

Guards are conditions that determine whether a transition should occur based on the current context or event data.

```typescript
transitions: {
  PLAY: {
    target: 'playing',
    cond: (context, event) => context.connectionType === 'WiFi',
    action: (context, event) => { /* ... */ },
  },
},
```

### Entry and Exit Actions

Define actions to execute when entering or exiting a state.

```typescript
states: {
  playing: {
    onEntry: async (context) => {
      console.log('Started playing');
      await fetchData();
    },
    onExit: (context) => {
      console.log('Stopped playing');
    },
    /* ... */
  },
},
```

### Asynchronous Actions

Support asynchronous operations within actions and state entry/exit functions.

```typescript
transitions: {
  LOAD_DATA: {
    target: 'loading',
    action: async (context, event) => {
      context.data = await fetchDataFromAPI();
    },
  },
},
```

### Delayed Transitions with Dynamic Timing

Schedule transitions to occur after a delay, with timing based on the context or event data.

```typescript
after: [
  {
    delay: (context) => context.delayDuration,
    transition: {
      target: 'paused',
      action: (context) => {
        console.log('Auto-pausing after delay');
      },
    },
  },
],
```

### Error Handling

Gracefully handle errors during transitions and actions by implementing the `handleError` method.

```typescript
private async handleError(error: any, state: string, event?: TEvent): Promise<void> {
  console.error(`Error in state "${state}":`, error);
  // Implement custom error handling logic here
}
```

## Examples

### Media Player State Machine

The following example demonstrates a media player state machine with parallel and nested states, including playback and network states. It utilizes advanced features like guards, entry/exit actions, asynchronous actions, and delayed transitions.

```typescript
import { Machine, StateDefinition } from 'statecharts-ts';

// Define events, context, and state definition
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
  volume: number;
  delayDuration: number;
}

const mediaPlayerMachineDefinition: StateDefinition<MediaPlayerEvent, MediaPlayerContext> = {
  parallel: true,
  states: {
    playback: {
      initial: 'stopped',
      states: {
        stopped: {
          onEntry: async (context) => {
            console.log('Entering stopped state');
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log('Stopped state ready');
          },
          transitions: {
            PLAY: {
              target: 'playback.playing',
              cond: (context) => context.connectionType === 'WiFi',
              action: async (context, event) => {
                if (event.type === 'PLAY' && event.data) {
                  context.currentTrackId = event.data.trackId;
                  context.currentTrackName = event.data.trackName;
                  console.log(`Loading track ${context.currentTrackName}`);
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  console.log('Track loaded');
                }
              },
            },
          },
        },
        playing: {
          after: [
            {
              delay: (context) => context.delayDuration,
              transition: {
                target: 'playback.paused',
                action: (context) => {
                  console.log('Auto-pausing after delay');
                },
              },
            },
          ],
          transitions: {
            PAUSE: { target: 'playback.paused' },
            STOP: {
              target: 'playback.stopped',
              action: (context) => {
                context.currentTrackId = undefined;
                context.currentTrackName = undefined;
                console.log('Playback stopped');
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
                console.log('Playback stopped');
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
                  console.log(`Connected via ${context.connectionType}`);
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
                console.log('Disconnected from network');
              },
            },
          },
        },
      },
    },
  },
};

const initialStates: string[] = ['playback', 'network'];
const mediaPlayerContext: MediaPlayerContext = {
  volume: 50,
  delayDuration: 5000, // 5 seconds delay
};

// Create the state machine instance
const mediaPlayerMachine = new Machine<MediaPlayerEvent, MediaPlayerContext>(
  mediaPlayerMachineDefinition,
  mediaPlayerContext,
  initialStates
);

// Subscribe to transitions
mediaPlayerMachine.onTransition((states) => {
  console.log('Current States:', states);
  console.log('Context:', mediaPlayerMachine.getContext());
});

// Trigger events
(async () => {
  await mediaPlayerMachine.send({ type: 'CONNECT', data: { connectionType: 'WiFi' } });
  await mediaPlayerMachine.send({ type: 'PLAY', data: { trackId: '123', trackName: 'My Song' } });
  // Wait for the auto-pause after delay
})();
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
const watchMachineDefinition: StateDefinition<WatchEvent, WatchContext> = {
  initial: 'timekeeping',
  states: {
    timekeeping: {
      onEntry: (context) => {
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
      onEntry: (context) => {
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
      onEntry: (context) => {
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
      onEntry: (context) => {
        console.log('Entered Time Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'timeSetting',
          action: (context) => {
            context.time.setMinutes(context.time.getMinutes() + 1);
            console.log(`Time Adjusted: ${context.time.toLocaleTimeString()}`);
          },
        },
        PRESS_B: { target: 'dateSetting' },
        LONG_PRESS_C: { target: 'timekeeping' },
      },
    },
    dateSetting: {
      onEntry: (context) => {
        console.log('Entered Date Setting Mode');
      },
      transitions: {
        PRESS_C: {
          target: 'dateSetting',
          action: (context) => {
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
const watchMachine = new Machine<WatchEvent, WatchContext>(
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

- `TEvent`: A type for events, which must include a `type` property and can have additional data.
- `TContext`: A type representing the state machine's context or data.

#### Constructor

```typescript
new Machine<TEvent, TContext>(
  stateDefinition: StateDefinition<TEvent, TContext>,
  context: TContext,
  initialStates: string[]
)
```

- **`stateDefinition`**: Defines the states, transitions, and behavior of the state machine.
- **`context`**: The initial context or data for the state machine.
- **`initialStates`**: An array of initial states to enter when the machine is instantiated.

#### Methods

- **`send(event: TEvent): Promise<void>`**  
  Triggers a transition based on the current state and the event.

- **`getState(): string[]`**  
  Returns the current state(s) of the machine.

- **`getContext(): TContext`**  
  Returns the current context of the machine.

- **`onTransition(callback: (state: string[]) => void): void`**  
  Subscribes to state transitions with a callback function.

- **`offTransition(callback: (state: string[]) => void): void`**  
  Unsubscribes a previously subscribed callback from state transitions.

- **`serialize(): string`**  
  Serializes the current state(s) and context of the machine.

- **`static parse(serializedData: string, stateDefinition: StateDefinition<TEvent, TContext>): Machine<TEvent, TContext>`**  
  Parses the serialized data and restores the machine's state(s) and context.

### `StateDefinition` Type

Defines the structure and behavior of states within the state machine.

```typescript
type StateDefinition<TEvent extends { type: string }, TContext> = {
  initial?: string;
  parallel?: boolean;
  states?: Record<string, StateDefinition<TEvent, TContext>>;
  transitions?: Record<string, Transition<TContext, TEvent>>;
  onEntry?: (context: TContext, event?: TEvent) => void | Promise<void>;
  onExit?: (context: TContext, event?: TEvent) => void | Promise<void>;
  after?: AfterTransition<TContext, TEvent>[];
};
```

### `Transition` Type

Defines a state transition.

```typescript
type Transition<TContext, TEvent> = {
  target: string | string[];
  action?: (context: TContext, event: TEvent) => void | Promise<void>;
  cond?: (context: TContext, event: TEvent) => boolean | Promise<boolean>;
};
```

### `AfterTransition` Type

Defines a delayed transition.

```typescript
type AfterTransition<TContext, TEvent> = {
  delay: number | ((context: TContext, event?: TEvent) => number);
  transition: Transition<TContext, TEvent>;
};
```

## Statecharts Resources

- [Statecharts on Wikipedia](https://en.wikipedia.org/wiki/State_machine#Statecharts)
- [Statecharts in Software Engineering](https://www.cs.cmu.edu/~mleone/courses/15-817-f11/slides/statecharts.pdf)
- [xstate](https://xstate.js.org/docs/) - A popular state machine library for JavaScript/TypeScript.
- [David Harel's Original Paper on Statecharts](https://www.cs.tau.ac.il/~stoledo/courses/2003_1/statechart.pdf)
- [The World of Statecharts](https://statecharts.dev)

## License

This project is licensed under the [MIT License](LICENSE).