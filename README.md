# statecharts-ts

![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)
![License](https://img.shields.io/npm/l/statecharts-ts)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

A lightweight, type-safe state machine library for TypeScript with zero dependencies. Build predictable state machines with full type inference and compile-time safety.

## Features

Add...

## Installation

```bash
npm install statecharts-ts
# or
yarn add statecharts-ts
# or
pnpm add statecharts-ts
```

## Quick Start

```typescript
import { machineFactory } from 'statecharts-ts';

// Define your events
type Events = { type: 'TOGGLE' } | { type: 'RESET' };

// Create a machine
const toggleMachine = machineFactory({
  events: {} as Events,
  context: { count: 0 },
  states: {
    off: {
      initial: true,
      on: {
        TOGGLE: () => 'on',
      },
    },
    on: {
      on: {
        TOGGLE: () => 'off',
        RESET: () => 'off',
      },
    },
  },
});

// Start the machine
toggleMachine.start();

// Subscribe to state changes
toggleMachine.subscribe((state) => {
  console.log('Current state:', state);
});

// Send events
toggleMachine.send({ type: 'TOGGLE' });
```

## Core Concepts

statecharts-ts is a TypeScript implementation of Harel Statecharts, providing a robust and type-safe way to manage application state. At its core, it allows you to create finite state machines (FSMs) that can model simple state transitions. As your needs grow, it supports advanced features like:

- Nested (hierarchical) states for modeling complex state relationships
- Parallel states for handling independent processes
- Typed events and context for compile-time safety
- State entry/exit actions
- State transitions with actions

The library draws inspiration from industry standards like XState and SCXML while maintaining a focus on TypeScript-first development. For those interested in the theoretical foundations, David Harel's seminal paper "Statecharts: A Visual Formalism for Complex Systems" provides excellent background reading.

## Creating a machine

A machine is created using the `machineFactory` function. This function takes an object with three properties: `events`, `context`, and `states`.

```typescript
const machine = machineFactory({
  // config
});
```

## Starting a machine

Once a machine is created, it needs to be started. This can be done by calling the `start` method on the machine instance:

```typescript
machine.start(); // start the machine
```

### States

States represent the different modes your application can be in.

For example:

```typescript
const machine = machineFactory({
  states: {
    // define states
    online: {},
    offline: {},
  },
});
```

This isn't very useful, as we have a state machine with two state, but no way to change state! The most basic way of doing that defining state transitions via events.

For more information on states, see the [API docs](./docs/api.md#states).

### Events

Events trigger transitions between states, and can be used to pass data into the state machine for logic and commiting to interal storage (context which will be exmapled later.)

```typescript
type MyEvents = { type: 'START'; data: { id: string } } | { type: 'COMPLETE' }; // define events

const machine = machineFactory({
  events: {} as MyEvents, // define events
  states: {}, // define states
});

machine.send({ type: 'START', data: { id: '123' } }); // send an event to the machine
```

Events are strongly typed using TypeScript discriminated unions. Each event must have a `type` property that identifies the event, and can optionally include additional data:

```typescript
type MyEvents = { type: 'START'; data: { id: string } } | { type: 'COMPLETE' };
```

For more information on events, see the [API docs](./docs/api.md#events).

### Transitions

Transitions define how states change in response to events. They are defined in the `on` property of a state and map event types to either:

1. A target state name (string)
2. A transition function that returns a target state

Basic string transitions:

```typescript
type MyEvents = { type: 'START' } | { type: 'STOP' };

const machine = machineFactory({
  events: {} as MyEvents, // define events
  states: {
    stopped: {
      on: {
        START: () => 'running', // transition to running state
      },
    },
    running: {
      on: {
        STOP: 'stopped',
      },
    },
  },
});
```

Transition functions can be used to perform logic and update context:

```typescript
type MyEvents = { type: 'START' } | { type: 'STOP' };

const machine = machineFactory({
  events: {} as MyEvents,
  context: { count: 0 },
  states: {
    stopped: {
      on: {
        START: ({ context, setContext }) => {
          setContext((ctx) => ({ ...ctx, count: ctx.count + 1 }));
          return 'running';
        },
      },
    },
  },
});

machine.send({ type: 'START' });
```

### Entry handlers

Entry handlers are created by defining a callback with `onEntry`. These handlers are executed upon entering a state and can be used to perform side effects or update the context:

```typescript
const machine = machineFactory({
  states: {
    stopped: {
      onEntry: () => {
        // perform side effects
        console.log('Entering stopped state');
      },
    },
  },
});
```

Entry handlers can be used to perform logic before entering a state, such as fetching data or performing validation.

### Exit handlers

Exit handlers are implemented by defining a callback with `onExit`. These handlers are executed when exiting a state and can be used to perform cleanup or other side effects:

```typescript
const machine = machineFactory({
  events: {} as MyEvents,
  states: {
    stopped: {
      onExit: () => {
        // perform side effects
        console.log('Exiting stopped state');
      },
    },
  },
});
```

### Context

Context is used to store data that is shared between states. It is fully typed and can be updated using the `setContext` function.

```typescript
type Context = {
  user: { id: string } | null;
  attempts: number;
};

const machine = machineFactory<MyEvents, Context>({
  context: { user: null, attempts: 0 },
  states: {
    idle: {
      on: {
        START: ({ context, setContext }) => {
          setContext((ctx) => ({ ...ctx, attempts: ctx.attempts + 1 }));
          return 'loading';
        },
      },
    },
  },
});
```

## Advanced Usage

Check out our [examples](./examples) directory for more complex use cases, including:

- Authentication flows
- Form validation
- API integration
- Concurrent states
- History states

## API Reference

For detailed API documentation, visit our [API docs](./docs/api.md).

## TypeScript Integration

statecharts-ts provides full TypeScript support with strict type checking:

```typescript
// Define your events
type Events = { type: 'SUBMIT'; data: { email: string } } | { type: 'CANCEL' };

// Define your context
interface Context {
  email: string | null;
  error: string | null;
}

// Your machine is now fully typed
const formMachine = machineFactory<Events, Context>({
  context: { email: null, error: null },
  states: {
    idle: {
      initial: true,
      on: {
        // Type-safe event handling
        SUBMIT: ({ event, setContext }) => {
          setContext({ email: event.data.email, error: null });
          return 'submitting';
        },
      },
    },
    submitting: {
      // Type-safe context access
      onEntry: async ({ context }) => {
        try {
          await submitEmail(context.email!);
          return 'success';
        } catch (error) {
          return 'error';
        }
      },
    },
    error: {},
    success: {},
  },
});
```

## Best Practices

### State Organization

- Keep states focused and single-purpose
- Use hierarchical states for complex flows
- Leverage parallel states for independent concerns
- Use meaningful state names that describe the system's behavior

### Event Design

```typescript
// Good: Events are specific and carry relevant data
type Events =
  | { type: 'FORM_SUBMITTED'; data: FormData }
  | { type: 'VALIDATION_FAILED'; data: { errors: string[] } }
  | { type: 'RETRY_REQUESTED' };

// Avoid: Generic events with ambiguous purposes
type BadEvents = { type: 'UPDATE'; data: any } | { type: 'CHANGE' };
```

### Context Management

```typescript
// Good: Structured context with clear types
interface Context {
  user: {
    id: string;
    preferences: UserPreferences;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

// Avoid: Loose context structure
interface BadContext {
  data: any;
  flags: Record<string, boolean>;
}
```

## Performance Considerations

- Use `parallel: true` only when states need to be truly concurrent
- Clean up subscriptions when they're no longer needed
- Avoid deep nesting of states unless necessary
- Use context judiciously for state that truly needs to be shared

## Community and Support

- 📦 [NPM Package](https://www.npmjs.com/package/statecharts-ts)
- 💬 [Discord Community](https://discord.gg/statecharts-ts)
- 📝 [Issue Tracker](https://github.com/yourusername/statecharts-ts/issues)
- 📚 [Documentation](https://statecharts-ts.dev)

## Related Projects

- [XState](https://xstate.js.org/) - A comprehensive, industry-standard state management library for JavaScript/TypeScript
- [Robot](https://github.com/matthewp/robot) - A similar finite state machine library

## Credits

statecharts-ts is inspired by:

- David Harel's foundational work on statecharts
- David Khourshid's excellent work on [XState](https://github.com/statelyai/xstate)
- The broader state management community

## License

MIT © [Your Name]

---
