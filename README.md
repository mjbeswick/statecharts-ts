# Statecharts-TS

&#x20;&#x20;

A lightweight, class-less, type-safe state machine library for TypeScript. Effortlessly define and manage state transitions while harnessing TypeScript's powerful type system for robust, scalable state management.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Creating a State Machine](#creating-a-state-machine)
  - [Defining States and Transitions](#defining-states-and-transitions)
  - [Dispatching Events](#dispatching-events)
- [API Reference](#api-reference)
  - [createState](#createstate)
  - [StateMachine](#statemachine)
  - [StateResult](#stateresult)
- [Testing](#testing)
- [Contributing](#contributing)
- [Additional Resources on Statecharts](#additional-resources-on-statecharts)
- [License](#license)
- [Contact](#contact)

## Features

- **Class-less Design**: Manage states using functions and closures, avoiding the overhead of classes.
- **Type Safety**: Leverage TypeScript's type system to ensure safe and reliable state transitions.
- **Flexible Transitions**: Easily define immediate, delayed, and event-driven transitions.
- **Centralized Event Handling**: Dispatch events centrally, ensuring consistent state management.
- **Ease of Testing**: Predictable, test-friendly design for maintainable and scalable codebases.

## Installation

Install `statecharts-ts` via npm or Yarn:

```bash
npm install statecharts-ts
```

```bash
yarn add statecharts-ts
```

## Usage

### Creating a State Machine

To create a state machine, import `createState` and define your states, transitions, and actions:

```typescript
import { createState, StateMachine, StateResult } from 'statecharts-ts';

// Define the context interface
interface LightContext {
  beforeGoPeriod: number;
  beforeStopPeriod: number;
  stopPeriod: number;
  trafficRed: boolean;
  trafficAmber: boolean;
  trafficGreen: boolean;
  pedestrianRed: boolean;
  pedestrianGreen: boolean;
}

// Initialize the context
const lightContext: LightContext = {
  beforeGoPeriod: 3000, // 3 seconds
  beforeStopPeriod: 10000, // 10 seconds
  stopPeriod: 10000, // 10 seconds
  trafficRed: true,
  trafficAmber: false,
  trafficGreen: false,
  pedestrianRed: false,
  pedestrianGreen: true,
};

// Define states
let stopped: StateResult<'STOP', LightContext>;
let beforeGo: StateResult<'GO', LightContext>;
let go: StateResult<'GO', LightContext>;
let beforeStop: StateResult<'STOP', LightContext>;

// Initialize states using createState
stopped = createState<'STOP', LightContext>({
  context: lightContext,
  action: (context) => {
    context.trafficRed = true;
    context.trafficAmber = false;
    context.trafficGreen = false;
    context.pedestrianRed = false;
    context.pedestrianGreen = true;
  },
  after: {
    delay: (context) => context.stopPeriod,
    target: () => beforeGo,
  },
});

// Define other states similarly...

// Create the state machine
const trafficLight: StateMachine<'STOP', LightContext> = createState<'STOP', LightContext>({
  initial: stopped,
  context: lightContext,
  states: {
    stopped,
    beforeGo,
    go,
    beforeStop,
  },
}) as StateMachine<'STOP', LightContext>;
```

### Defining States and Transitions

Each state may have `action`, `after`, and `on` properties to define behaviour and transitions:

- **`action`**: Executed when entering a state, allowing you to modify the context.
- **`after`**: Defines a delayed transition after a specified time.
- **`on`**: Defines event-based transitions.

```typescript
beforeGo = createState<'GO', LightContext>({
  context: lightContext,
  action: (context) => {
    context.trafficRed = false;
    context.trafficAmber = true;
    context.trafficGreen = false;
    context.pedestrianRed = true;
    context.pedestrianGreen = false;
  },
  after: {
    delay: (context) => context.beforeGoPeriod,
    target: () => go,
  },
});

go = createState<'GO', LightContext>({
  context: lightContext,
  action: (context) => {
    context.trafficRed = false;
    context.trafficAmber = false;
    context.trafficGreen = true;
    context.pedestrianRed = true;
    context.pedestrianGreen = false;
  },
  on: {
    STOP: {
      target: () => beforeStop,
    },
  },
});
```

### Dispatching Events

Use the `send` method of the `StateMachine` to dispatch events and trigger transitions:

```typescript
// Dispatch the 'STOP' event
trafficLight.send('STOP');

// The state machine will handle the transition based on the current state
```

## API Reference

### `createState`

Creates a state or a state machine based on the provided definition.

```typescript
function createState<E extends string, C>(
  definition: StateDefinition<E, C>
): StateMachine<E, C> | StateResult<E, C>;
```

#### Parameters:

- **`definition`**: Object defining the state or state machine, including `context`, `action`, `after`, `on`, `initial`, and `states`.

#### Returns:

- **`StateMachine<E, C> | StateResult<E, C>`**: Returns a `StateMachine` if multiple states are defined, otherwise returns a single `StateResult`.

### `StateMachine`

Represents the state machine, allowing event dispatching and state management.

```typescript
interface StateMachine<E extends string, C> {
  send: (event: E) => void;
  setState: (state: StateResult<E, C>) => void;
  value: StateResult<E, C>;
  context: C;
}
```

#### Properties:

- **`send(event: E)`**: Dispatches an event to trigger transitions.
- **`setState(state: StateResult<E, C>)`**: Manually sets the current state.
- **`value`**: The current active state.
- **`context`**: The shared context object.

### `StateResult`

Represents an individual state within the state machine.

```typescript
interface StateResult<E extends string, C> {
  send: (event: E) => void;
  context: C;
  setState?: (state: StateResult<E, C>) => void;
  action?: Action<C>;
  after?: AfterTransition<E, C>;
  on?: OnTransition<E, C>;
}
```

#### Properties:

- **`send(event: E)`**: Dispatches an event.
- **`context`**: The shared context object.
- **`setState(state: StateResult<E, C>)`**: (Optional) Sets the current state.
- **`action`**: (Optional) Function executed upon entering the state.
- **`after`**: (Optional) Defines a delayed transition.
- **`on`**: (Optional) Defines event-based transitions.

## Additional Resources on Statecharts

- **[Statecharts: A Visual Formalism for Complex Systems](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf)**[ (PDF)](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf) - The original paper by David Harel.
- **[Statecharts by David Harel](https://www.sciencedirect.com/science/article/abs/pii/0167642387900359)** - Overview of Harel statecharts.
- **[Statechart Diagrams (UML)](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/)**[ - Visual Paradigm](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/) - Introduction to statechart diagrams.
- **[Introduction to Hierarchical State Machines](https://statecharts.github.io/)** - Interactive guide on hierarchical state machines.
- **[State Machines vs. Statecharts](https://martinfowler.com/articles/state-machines.html)**[ - Martin Fowler](https://martinfowler.com/articles/state-machines.html) - Overview by Martin Fowler.
- **[Constructing the User Interface with Statecharts](https://archive.org/details/isbn_9780201342789) - Book by Ian Horrocks and Jeff Z. Pan.



## License

This project is licensed under the [MIT License](LICENSE).

