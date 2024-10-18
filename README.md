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
- [Contributing](#contributing)
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

Here's a basic example of how to use statecharts-ts:

```typescript
import { createMachine } from 'statecharts-ts';

const trafficLightMachine = createMachine({
  id: 'trafficLight',
  initial: 'red',
  states: {
    red: {
      on: { NEXT: 'green' },
    },
    yellow: {
      on: { NEXT: 'red' },
    },
    green: {
      on: { NEXT: 'yellow' },
    },
  },
});

let currentState = trafficLightMachine.initial;
console.log(currentState); // 'red'

currentState = trafficLightMachine.transition(currentState, 'NEXT');
console.log(currentState); // 'green'
```

## API Reference

### State Machine

#### `createStateMachine(config)`

Creates a state machine with the given configuration.

- **Parameters:**

  - `config` (Object): The configuration object for the state machine.
    - `initialState` (S): The initial state of the state machine.
    - `context` (C): The context object for the state machine.
    - `transitionMap` (TransitionMap): A map of transitions for each state.

- **Returns:** An object with the following methods:
  - `getState()`: Returns the current state of the machine.
  - `getContext()`: Returns the current context of the machine.
  - `send(event)`: Sends an event to the state machine, potentially triggering a state transition.
    - **Parameters:**
      - `event` (E): The event to send.
  - `subscribe(callback)`: Subscribes a callback function to be notified of state changes.
    - **Parameters:**
      - `callback` (function): The function to be called when the state changes.
  - `toJSON()`: Serializes the current state and context to a JSON string.
  - `fromJSON(json)`: Deserializes a JSON string to update the current state and context.
    - **Parameters:**
      - `json` (string): A JSON string representation of the state and context.

### Event Bus

#### `createEventBus()`

Creates and returns a new event bus.

- **Returns:** An object implementing the `EventBus` interface with the following methods:
  - `subscribe(callback)`: Subscribes a callback function to receive events.
    - **Parameters:**
      - `callback` (function): The function to be called when an event is published.
  - `publish(event)`: Publishes an event to all subscribed callbacks.
    - **Parameters:**
      - `event` (E): The event to be published.

### Parallel States

The state machine created by `createStateMachine` supports parallel states, which are defined as an array. This allows the state machine to manage multiple active states simultaneously. When the `currentState` is an array, the state machine processes each state independently, allowing for complex state configurations where multiple states can be active at the same time.

- **Handling Parallel States**: The `send` function checks if the `currentState` is an array and uses `handleParallelStateTransitions` to manage transitions for each state in the array.
- **Transition Execution**: For each state in the parallel states array, applicable transitions are checked and executed if their guard conditions are met. Exit actions are handled, and the `currentState` is updated accordingly.

This feature is particularly useful for scenarios where different parts of the system need to operate independently but within the same state machine context.

### Nested States

The state machine created by `createStateMachine` supports nested states, which are defined as objects within the `states` property of the configuration object. Nested states allow for a hierarchical representation of states, enabling developers to model complex behaviors in a structured manner.

- **Handling Nested States**: The `send` function recursively traverses the state hierarchy to find the appropriate state for the event. It uses the `handleNestedStateTransitions` function to manage transitions within nested states.

This feature is beneficial for organizing and managing the behavior of complex systems with multiple levels of states and sub-states.

## Examples

### Basic State Machine

```typescript
import { createMachine } from 'statecharts-ts';

const trafficLightMachine = createMachine({
  id: 'trafficLight',
  initial: 'red',
  states: {
    red: {
      on: { NEXT: 'green' },
    },
    yellow: {
      on: { NEXT: 'red' },
    },
    green: {
      on: { NEXT: 'yellow' },
    },
  },
});

let currentState = trafficLightMachine.initial;

console.log(currentState); // 'red'

currentState = trafficLightMachine.transition(currentState, 'NEXT');

console.log(currentState); // 'green'
```

### Hierarchical States

```typescript
import { createMachine } from 'statecharts-ts';

const lightSwitchMachine = createMachine({
  id: 'lightSwitch',
  initial: 'off',
  states: {
    off: {
      on: { TOGGLE: 'on' },
    },
    on: {
      initial: 'low',
      states: {
        low: {
          on: { TOGGLE: 'high' },
        },
        high: {
          on: { TOGGLE: 'low' },
        },
      },
    },
  },
});

let currentState = lightSwitchMachine.initial;

console.log(currentState); // 'off'

currentState = lightSwitchMachine.transition(currentState, 'TOGGLE');

console.log(currentState); // 'on'

currentState = lightSwitchMachine.transition(currentState, 'TOGGLE');

console.log(currentState); // 'high'
```

### Parallel States

```typescript
import { createMachine } from 'statecharts-ts';

const ovenMachine = createMachine({
  id: 'oven',
  initial: ['off', 'cold'],
  states: {
    off: {
      on: { TURN_ON: 'on' },
    },
    on: {
      on: { TURN_OFF: 'off' },
    },
    cold: {
      on: { HEAT: 'hot' },
    },
    hot: {
      on: { COOL: 'cold' },
    },
  },
});

let currentState = ovenMachine.initial;

console.log(currentState); // ['off', 'cold']

currentState = ovenMachine.transition(currentState, 'TURN_ON');

console.log(currentState); // ['on', 'cold']

currentState = ovenMachine.transition(currentState, 'HEAT');

console.log(currentState); // ['on', 'hot']
```

## Complex Example

Please refer to the [examples](examples) directory for more detailed and complex examples of using statecharts-ts.

