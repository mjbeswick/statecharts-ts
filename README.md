Here is a sample `README.md` for your NPM package that explains the concept of statecharts, highlights the benefits of using statecharts for modelling complex UIs, and includes relevant information about your module.

# Statecharts-TS

Statecharts-TS is a lightweight, TypeScript-powered statechart library for building complex state machines. This library is particularly useful for modelling complex UIs and system flows with deterministic, predictable, and visualizable state transitions. This is intended to be a simple and easy-to-use library for developers who want to leverage the power of statecharts in their applications.

## Introduction to Statecharts

Statecharts are a formalism for modelling the states of a system and their transitions. They extend finite state machines (FSMs) by introducing concepts such as:
- **Hierarchical states**: Allows states to be nested, reducing complexity.
- **Parallel states**: Supports multiple states running in parallel.
- **Actions and transitions**: Defines what happens during transitions between states.
- **Guards**: Conditional transitions based on the system's current context.

Statecharts were first proposed by computer scientist David Harel in the 1980s as an extension of FSMs. The formalism provides a visual and intuitive way to model the behavior of complex systems, such as user interfaces, embedded systems, or workflows.

### Benefits of Using Statecharts

Statecharts are ideal for modeling complex UIs and workflows for several reasons:
- **Predictability**: Statecharts ensure that each event triggers a deterministic state transition, making it easier to understand the behavior of your application.
- **Maintainability**: By encapsulating system behaviors into clearly defined states and transitions, statecharts reduce complexity and improve code organization.
- **Composability**: With nested and parallel states, statecharts allow you to break down a complex UI into smaller, manageable components that run independently or concurrently.
- **Clarity**: Statecharts provide a clear visual model of how your system behaves, making it easier for developers and designers to collaborate.
- **Error Reduction**: Statecharts can help prevent edge cases and unexpected behavior in complex UI systems by clearly defining valid transitions and states.

### Learn More About Statecharts
- [XState Docs](https://xstate.js.org/docs/): An alternative statechart library for JavaScript and TypeScript with a rich set of features.
- [Statecharts Specification](https://statecharts.dev/): Official documentation on statecharts, including deep dives into parallel states, hierarchy, and events.
- [David Harel’s Original Paper](https://www.sciencedirect.com/science/article/pii/0167642390900349): The formalism that introduced statecharts.

## Installation

You can install the Statecharts-TS package via NPM:

```bash
npm install statecharts-ts
```

## Quick Start

Here’s a simple example of how to define and use a state machine with `Statecharts-TS`.

```typescript
import { createState } from 'statecharts-ts';

// Define the states and transitions for a simple microwave model

const idleState = createState({
    context: { isDoorClosed: true, time: 30 },
    enter: (context) => {
        console.log("Microwave is idle.");
    },
    on: {
        Start: {
            target: () => cookingState,
            guard: (context) => context.isDoorClosed  // Ensure the door is closed before starting
        },
        OpenDoor: {
            action: (context) => { 
                context.isDoorClosed = false;
                console.log("Door opened.");
            }
        }
    }
});

const cookingState = createState({
    context: { isDoorClosed: true, time: 30 },
    enter: (context) => {
        console.log(`Cooking for ${context.time} seconds.`);
    },
    after: {
        target: () => idleState,
        delay: 30000,  // Transition after 30 seconds
        guard: (context) => context.isDoorClosed
    }
});

const microwaveStateMachine = {
    idle: idleState,
    cooking: cookingState
};

// Example usage
microwaveStateMachine.idle.send('Start');  // Starts cooking if the door is closed
```

### State Configuration

In the above example:
- `idleState` represents the microwave in an idle state, waiting for the user to start cooking or open the door.
- `cookingState` simulates a cooking operation, where the microwave will automatically return to the idle state after a timeout.

You can define transitions using the `on` property and delayed transitions using the `after` property, making state management intuitive and flexible.

## API Reference

### `createState(config, parent?)`

Creates a state with the given configuration. The configuration can include:
- `context`: The data/context associated with the state.
- `enter`: A function executed when the state is entered.
- `on`: A mapping of events and their corresponding transitions or actions.
- `after`: A timed transition with a delay and optional guard conditions.
- `parallel`: A flag to define parallel states.
- `states`: Nested states for hierarchical state management.

### State Methods

- `send(eventName, data?)`: Sends an event to the current state, triggering transitions or actions.
- `subscribe(callback)`: Subscribe to state changes. The callback receives the new state and context whenever a transition occurs.
- `debug()`: Returns a debug-friendly object showing the current state and context.

## Why Use Statecharts-TS?

Statecharts-TS provides:
- **Strong typing**: Fully typed statecharts with TypeScript for safer, more predictable state transitions.
- **Flexibility**: Use nested states, parallel states, guards, actions, and after-timeouts to handle even the most complex workflows.
- **Maintainability**: Improve the structure of your codebase and make it easy to reason about state transitions.

## License

This project is licensed under the MIT License.
