![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)

# Statecharts-ts

A lightweight, class-less, type-safe statechart (state machine) library for TypeScript. Effortlessly define and manage state transitions while harnessing TypeScript's powerful type system for robust, scalable state management.

## Table of Contents

- [What are Statecharts?](#what-are-statecharts)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Additional Resources on Statecharts](#additional-resources-on-statecharts)
- [License](#license)



## What are Statecharts?

Statecharts are a powerful extension of finite state machines, introduced by David Harel in the 1980s, that help model the behavior of complex systems in a clear and structured manner. They provide a visual and formal approach to represent states, transitions, and actions, allowing developers to define the possible states of an application and the events that trigger transitions between these states.

Key features of statecharts include:

- Hierarchical States: States can contain nested sub-states, enabling better organization and management of complex behaviors.
- Parallel States: Support for concurrent states allows different parts of a system to operate independently.
- Event Handling: Statecharts can react to events and perform actions, making them suitable for interactive applications.

By using statecharts, developers can create more predictable and maintainable code, facilitating the design of responsive and robust applications.

## Features

- **Lightweight**: Minimal overhead and dependencies for efficient performance.
- **Class-less**: Functional approach for easy integration and testing.
- **Type-safe**: Leverage TypeScript's type system for compile-time checks and autocompletion.
- **Hierarchical States**: Support for nested states to model complex behaviors.
- **Parallel States**: Handle concurrent states effortlessly.
- **Event-driven**: Define clear transitions and actions based on events.
- **Easy to use**: Simple API for defining and working with statecharts.

## Installation

Install statecharts-ts using npm:

```bash
npm install statecharts-ts
```

Or using yarn:

```bash
yarn add statecharts-ts
```

## Usage

Here's a basic example of how to use `statecharts-ts`:

```typescript
import { createStateMachine } from 'statecharts-ts';

const trafficLightMachine = createStateMachine({
  context: {
    traffic: { red: false, amber: false, green: false },
    pedestrian: { red: true, green: false },
    timeoutPeriods: {
      stop: 5000,
      prepareToGo: 2000,
      waitingToStop: 3000,
      readyToStop: 2000,
    },
  },
  states: {
    stop: {
      isInitial: true, // Specify the initial state
      onEntry: ({ context, send }) => {
        Object.assign(context, {
          traffic: { red: true, amber: false, green: false },
          pedestrian: { red: false, green: true },
        });
        setTimeout(() => send({ type: 'NEXT' }), context.timeoutPeriods.stop);
      },
      transitions: {
        NEXT: { target: 'prepareToGo' },
      }
    },
    // ... other states ...
  },
});

trafficLightMachine.start();
trafficLightMachine.subscribe((state, context) => {
  console.log(`Current state: ${state}`);
});
```

## API Reference

### State Machine

#### `createStateMachine(config)`

Creates a state machine with the given configuration.

- **Parameters:**
  - `config` (Object): The configuration object for the state machine.
    - `context` (C): The context object for the state machine.
    - `states` (TransitionMap<S, E, C>): A map of state definitions and transitions.

- **Returns:** An object with the following methods:
  - `getState()`: Returns the current state of the machine.
  - `getContext()`: Returns the current context of the machine.
  - `send(event)`: Sends an event to the state machine, potentially triggering a state transition.
  - `subscribe(callback)`: Subscribes a callback function to be notified of state changes.
  - `toJSON()`: Serializes the current state and context to a JSON string.
  - `fromJSON(json)`: Deserializes a JSON string to update the current state and context.
  - `start()`: Initializes the state machine and enters the initial state(s).

### Types

#### `StateTransition<S, E, C, T>`

Defines the possible transitions from a state, including optional guard conditions and actions.

#### `NestedState<S, E, C>`

Represents a nested state configuration, which can be compound or parallel.

#### `StateDefinition<S, E, C>`

Describes a state, including entry and exit actions, timeouts, and transitions.

- Properties:
  - `isInitial`: Indicates if the state is an initial state.
  - `isParallel`: Indicates if the state contains parallel sub-states.
  - `onEntry`: A function executed when entering the state.
  - `onExit`: A function executed when exiting the state.
  - `onTimeout`: Defines a timeout action and delay for the state.
  - `transitions`: A map of events to transitions.
  - `states`: Nested states (for compound or parallel states).

#### `TransitionMap<S, E, C>`

A map of state names to their corresponding `StateDefinition`.

### Helper Functions

#### `initializeState<S, E, C>(states: TransitionMap<S, E, C>): FlattenedState<S>`

Determines the initial state(s) of the state machine based on the `isInitial` property.

#### `flattenState<S>(state: FlattenedState<S>): S[]`

Flattens a potentially nested state structure into an array of state names.

### Parallel States

The state machine supports parallel states, which are defined using the `isParallel` property in the state definition. When a state is marked as parallel, it can have multiple active sub-states simultaneously.

- **Handling Parallel States**: The `send` function processes events for each active sub-state independently.
- **State Representation**: Parallel states are represented as an array of active sub-state names.

### Nested States

The state machine supports nested states, allowing for a hierarchical representation of states. Nested states are defined using the `states` property within a state definition.

- **Handling Nested States**: The state machine traverses the state hierarchy to find and execute transitions.
- **State Representation**: Nested states are represented using dot notation (e.g., 'parent.child').

## Examples

### Basic State Machine

```typescript
import { createStateMachine } from 'statecharts-ts';

const trafficLightMachine = createStateMachine({
  context: {},
  states: {
    red: {
      isInitial: true,
      transitions: {
        NEXT: { target: 'green' },
      },
    },
    yellow: {
      transitions: {
        NEXT: { target: 'red' },
      },
    },
    green: {
      transitions: {
        NEXT: { target: 'yellow' },
      },
    },
  },
});

trafficLightMachine.start();

let currentState = trafficLightMachine.getState();
console.log(currentState); // 'red'

trafficLightMachine.send({ type: 'NEXT' });
currentState = trafficLightMachine.getState();
console.log(currentState); // 'green'
```

### Hierarchical States

```typescript
import { createStateMachine } from 'statecharts-ts';

const lightSwitchMachine = createStateMachine({
  context: {},
  states: {
    off: {
      isInitial: true,
      transitions: {
        TOGGLE: { target: 'on' },
      },
    },
    on: {
      states: {
        low: {
          isInitial: true,
          transitions: {
            TOGGLE: { target: 'high' },
          },
        },
        high: {
          transitions: {
            TOGGLE: { target: 'low' },
          },
        },
      },
    },
  },
});

lightSwitchMachine.start();

let currentState = lightSwitchMachine.getState();
console.log(currentState); // 'off'

lightSwitchMachine.send({ type: 'TOGGLE' });
currentState = lightSwitchMachine.getState();
console.log(currentState); // 'on.low'

lightSwitchMachine.send({ type: 'TOGGLE' });
currentState = lightSwitchMachine.getState();
console.log(currentState); // 'on.high'
```

### Parallel States

```typescript
import { createStateMachine } from 'statecharts-ts';

const ovenMachine = createStateMachine({
  context: {},
  states: {
    operation: {
      isParallel: true, // Indicate that this state has parallel sub-states
      states: {
        power: {
          off: {
            isInitial: true, // Initial state for the power region
            transitions: {
              TURN_ON: { target: 'on' },
            },
          },
          on: {
            transitions: {
              TURN_OFF: { target: 'off' },
            },
          },
        },
        temperature: {
          cold: {
            isInitial: true, // Initial state for the temperature region
            transitions: {
              HEAT: { target: 'hot' },
            },
          },
          hot: {
            transitions: {
              COOL: { target: 'cold' },
            },
          },
        },
      },
    },
  },
});

ovenMachine.start();

let currentState = ovenMachine.getState();
console.log(currentState); // ['operation.power.off', 'operation.temperature.cold']

ovenMachine.send({ type: 'TURN_ON' });
currentState = ovenMachine.getState();
console.log(currentState); // ['operation.power.on', 'operation.temperature.cold']

ovenMachine.send({ type: 'HEAT' });
currentState = ovenMachine.getState();
console.log(currentState); // ['operation.power.on', 'operation.temperature.hot']
```

## Complex Example

Please refer to the [examples](src/examples) directory for more detailed and complex examples of using statecharts-ts.

## Additional Resources on Statecharts

- [Statecharts: A Visual Formalism for Complex Systems](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf)[ (PDF)](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf) - The original paper by David Harel.
- [Statecharts by David Harel](https://www.sciencedirect.com/science/article/abs/pii/0167642387900359) - Overview of Harel statecharts.
- [Statechart Diagrams (UML)](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/)[ - Visual Paradigm](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/) - Introduction to statechart diagrams.
- [Introduction to Hierarchical State Machines](https://statecharts.github.io/) - Interactive guide on hierarchical state machines.
- [State Machines vs. Statecharts](https://martinfowler.com/articles/state-machines.html)[ - Martin Fowler](https://martinfowler.com/articles/state-machines.html) - Overview by Martin Fowler.
- [Constructing the User Interface with Statecharts](https://archive.org/details/isbn_9780201342789) - Book by Ian Horrocks and Jeff Z. Pan.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.




