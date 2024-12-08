# API Documentation for `machineFactory`

## Overview

The `machineFactory` function is a versatile and powerful tool for creating finite state machines in JavaScript or TypeScript. It allows developers to define complex workflows, handle asynchronous events, and manage transitions between different states in a declarative manner. This documentation provides an extensive overview of how to use `machineFactory` effectively, including examples of nested states, parallel states, comparisons with other libraries like xState, and best practices.

### Importing the Module

To start using `machineFactory`, import it from your source file:

```typescript
import { machineFactory } from '../src';
```

### Function Signature

```typescript
machineFactory<Events, Context>(config: MachineConfig<Events, Context>): Machine;
```

- **`Events`**: Defines the types of events that can trigger state changes.
- **`Context`**: Represents the shared data context of the state machine.
- **`MachineConfig`**: Contains states, events, context, and other configuration details for setting up the state machine.

### Key Features

- **Finite States**: Define distinct states for the system, such as `authenticated`, `unauthenticated`, or error-handling states.
- **State Transitions**: Configure event-driven transitions between states.
- **Async Handling**: Handle asynchronous actions (e.g., network requests) using `onEntry` hooks.
- **Nested and Parallel States**: Design hierarchical states to manage complex workflows.
- **Declarative Transitions**: State transitions are defined declaratively, making the flow easier to understand and maintain.

## Comparison with xState

If you are familiar with xState, you'll find some similarities as well as some differences with `machineFactory`.

### Similarities:

- **Finite State Representation**: Both `machineFactory` and xState provide a formalized approach to managing finite states, helping organize workflows in a predictable manner.
- **Nested and Parallel States**: Both tools support nested and parallel states, allowing for complex workflows.
- **Context Management**: Both systems use a shared context object for storing global data related to the state machine.

### Differences:

- **Complexity**: xState offers more features out of the box, such as built-in interpreters, guards, and extensive TypeScript support. `machineFactory` is simpler and more lightweight, making it ideal for projects that do not require the full complexity of xState.
- **Customization**: `machineFactory` focuses more on flexibility and allowing developers to define asynchronous events and actions with greater control, while xState often uses built-in actions and more standardized APIs.
- **Learning Curve**: xState's richer feature set also comes with a steeper learning curve. In contrast, `machineFactory` offers a more minimal and intuitive API, which can be easier to pick up for small to medium-sized projects.

## Basic Example: Generic State Machine

Here is an example that showcases a generic state machine using `machineFactory`. This example demonstrates both nested states and asynchronous actions.

### Example Code: Generic State Machine

```typescript
type Events =
  | { type: 'START_PROCESS' }
  | { type: 'PROCESS_SUCCESS' }
  | { type: 'PROCESS_FAILURE' }
  | { type: 'RETRY' }
  | { type: 'UPDATE_DATA'; data: any };

type Context = {
  data: any;
  attempts: number;
};

const machine = machineFactory<Events, Context>({
  events: {} as Events,
  context: {
    data: null,
    attempts: 0,
  },
  states: {
    idle: {
      initial: true,
      on: {
        START_PROCESS: ({ context }) => {
          if (context.attempts < 5) {
            return 'processing';
          } else {
            console.log('Too many attempts, staying idle.');
            return 'idle';
          }
        },
      },
    },
    processing: {
      onEntry: async ({ setContext }) => {
        try {
          // Simulate some asynchronous processing logic
          const result = await new Promise((resolve) =>
            setTimeout(() => resolve('success'), 1000),
          );
          setContext(() => ({ data: result, attempts: 0 }));
          return 'success';
        } catch {
          setContext(({ attempts }) => ({ attempts: attempts + 1 }));
          return 'failure';
        }
      },
    },
    success: {
      onEntry: ({ context }) => {
        console.log('Process completed successfully with data:', context.data);
      },
    },
    failure: {
      onEntry: ({ after, context }) => {
        if (context.attempts < 3) {
          after(1000, () => {
            return 'retry';
          });
        } else {
          console.log('Max retry attempts reached.');
        }
      },
      on: {
        RETRY: () => 'processing',
      },
    },
    retry: {
      onEntry: () => {
        return 'processing';
      },
    },
  },
} as const);

machine.start();
```

In the above example, we have several generic states:

- **`idle`**: The initial state where the machine waits for the `START_PROCESS` event, guarded by an if statement that checks if the number of attempts is less than 5.
- **`processing`**: The state where some asynchronous processing takes place.
- **`success`**: The state reached when the processing completes successfully.
- **`failure`**: The state reached when the processing fails, with a retry mechanism if the attempts are below a threshold.
- **`retry`**: A transitional state that retries the `processing` state.

This generic example shows how you can manage different phases of an operation, including retries, handling success, and gracefully managing failures.

## Example: Reading and Updating Context

In many workflows, reading and updating the context is crucial for managing shared state between different transitions. Here is an example that demonstrates reading from and updating the context during state transitions.

### Example Code: Reading and Updating Context

```typescript
type Events = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' };

type Context = {
  count: number;
};

const counterMachine = machineFactory<Events, Context>({
  context: {
    count: 0,
  },
  states: {
    counting: {
      initial: true,
      on: {
        INCREMENT: ({ context, setContext }) => {
          setContext(({ count }) => ({ count: count + 1 }));
          console.log('Count incremented to:', context.count + 1);
          return 'counting';
        },
        DECREMENT: ({ context, setContext }) => {
          setContext(({ count }) => ({ count: count - 1 }));
          console.log('Count decremented to:', context.count - 1);
          return 'counting';
        },
        RESET: ({ setContext }) => {
          setContext(() => ({ count: 0 }));
          console.log('Count reset to 0');
          return 'counting';
        },
      },
    },
  },
} as const);

counterMachine.start();
```

In this example, we have:

- **`counting`**: A state where we handle increment, decrement, and reset actions.
  - **`INCREMENT`**: Reads the current value of `count` from the context, increments it, updates the context, and logs the new value.
  - **`DECREMENT`**: Reads the current value of `count`, decrements it, updates the context, and logs the new value.
  - **`RESET`**: Resets the `count` value to 0 and updates the context.

This example shows how easy it is to read and update the context, ensuring that your state machine remains reactive to changes in shared state.

## Example: Using the `after` Function

The `after` function is used to schedule an action to occur after a specified delay. It is particularly useful for handling retries, timeouts, or delays in transitioning between states.

### Example Code: Using `after`

```typescript
type Events = { type: 'START_TIMER' } | { type: 'TIMER_COMPLETED' };

type Context = {
  timerDuration: number;
};

const timerMachine = machineFactory<Events, Context>({
  context: {
    timerDuration: 3000, // 3 seconds
  },
  states: {
    idle: {
      initial: true,
      on: {
        START_TIMER: () => 'timing',
      },
    },
    timing: {
      onEntry: ({ after, context }) => {
        // Schedule the `TIMER_COMPLETED` event after `timerDuration` milliseconds
        after(context.timerDuration, () => {
          console.log(
            'Timer completed after',
            context.timerDuration,
            'milliseconds',
          );
          return 'completed';
        });
      },
    },
    completed: {
      onEntry: () => {
        console.log('Timer has completed.');
      },
    },
  },
} as const);

timerMachine.start();
```

In this example, we have:

- **`idle`**: The initial state where the machine waits for the `START_TIMER` event.
- **`timing`**: The state that starts the timer when entered. The `after` function is used to schedule a transition to the `completed` state after a delay defined in the `context.timerDuration`.
- **`completed`**: The state reached when the timer is done.

### Explanation of `after`

- **Usage**: The `after` function is used to delay actions or transitions. It takes two arguments:

  1. **`delay`**: The number of milliseconds to wait before executing the action.
  2. **`callback`**: A function that will be executed once the delay has passed. This can return a new state name for the transition.

- **Example**: In the `timing` state, `after(context.timerDuration, () => { return 'completed'; })` is used to wait for the specified duration and then transition to the `completed` state.

The `after` function is useful for implementing timers, retries, and other delayed transitions, making it a powerful feature for controlling the timing of state changes.

## Context: Managing Shared State

The **context** is a key concept in `machineFactory` that helps manage and maintain shared state across different states of the machine. Context provides a way to store, read, and update global data that multiple states need access to. This enables state machines to be more dynamic and handle scenarios that require persistent data or configuration.

### Creating and Initializing Context

The context is defined as part of the state machine configuration. It is initialized with a default value when the machine starts. Here is an example of defining the context:

```typescript
type Context = {
  count: number;
  userData?: { name: string; age: number };
};

const machine = machineFactory<Events, Context>({
  context: {
    count: 0,
    userData: undefined, // Initially no user data
  },
  states: {
    // state definitions
  },
} as const);
```

In this example, the context has two properties: `count`, which is initialized to `0`, and `userData`, which is optional and starts as `undefined`.

### Reading from Context

When handling transitions or performing actions, you can read from the context to access shared state data. This helps inform transitions or actions based on the current state of the machine.

Example of reading from context:

```typescript
on: {
  CHECK_COUNT: ({ context }) => {
    if (context.count > 10) {
      return 'exceededLimit';
    } else {
      return 'withinLimit';
    }
  },
}
```

In this example, the `CHECK_COUNT` event reads the current value of `count` from the context to decide whether to transition to the `exceededLimit` or `withinLimit` state.

### Updating Context

Context can be updated using the `setContext` function, which is typically done during state transitions or entry actions (`onEntry`). Updating the context is essential for maintaining the state machine's dynamic behavior.

Example of updating context:

```typescript
on: {
  INCREMENT: ({ setContext, context }) => {
    setContext(() => ({ count: context.count + 1 }));
    return 'counting';
  },
}
```

In this example, when the `INCREMENT` event is received, the context is updated by increasing the `count` value by 1.

### Best Practices for Using Context

1. **Minimal Context**: Keep your context minimal to store only the necessary state data. Avoid storing state-specific data that should be handled by state transitions.
2. **Immutable Updates**: Use the `setContext` function to make immutable updates to the context, ensuring that previous context values are not directly modified.
3. **Shared Data**: Use context to store shared data that needs to be accessed or modified by multiple states, like user information, counters, or configuration settings.
4. **Avoid Overloading**: Do not overload context with complex logic. Keep context as a data store, and manage complex operations within the states or transitions.

By effectively managing context, you can build robust and flexible state machines that can adapt to changing requirements while maintaining clear and consistent shared data across states.

## Nested States Example

Nested states allow for hierarchical and granular control of different substates within a primary state. For example:

- **`idle`**: The machine is waiting for a start event.
- **`processing`**: The machine tries to process an event asynchronously.
- **`failure`**: If processing fails, the machine attempts to retry the operation, keeping track of the number of attempts.

The advantage of nested states is clear encapsulation of behaviors specific to each phase of a broader workflow.

### Example: Parallel States

`machineFactory` also supports parallel states, which are states that operate concurrently rather than in sequence. This feature is particularly useful when handling multiple independent processes within the system.

#### Use Case: Parallel Operations

Consider an example where a system runs two parallel operations: `dataSync` and `notifications`. These two processes operate independently but must coexist within the system.

```typescript
const parallelMachine = machineFactory({
  states: {
    main: {
      parallel: true,
      states: {
        dataSync: {
          initial: 'synchronizing',
          states: {
            synchronizing: {
              onEntry: ({ after }) => {
                // Simulate data sync process
                after(2000, () => {
                  return 'completed';
                });
              },
            },
            completed: {
              onEntry: () => {
                console.log('Data synchronization complete.');
              },
            },
          },
        },
        notifications: {
          initial: 'enabled',
          states: {
            enabled: {
              on: {
                DISABLE_NOTIFICATIONS: () => 'disabled',
              },
            },
            disabled: {
              on: {
                ENABLE_NOTIFICATIONS: () => 'enabled',
              },
            },
          },
        },
      },
    },
  },
});
```

In this configuration:

- The `main` state runs both `dataSync` and `notifications` in parallel.
- The `dataSync` state keeps track of a data synchronization process.
- The `notifications` state allows toggling between enabling or disabling notifications.

## Key Methods and Configuration

### `onEntry`

- **Usage**: Define behavior upon entering a particular state.
- **Example**:

  ```typescript
  processing: {
    onEntry: async ({ setContext }) => {
      // Perform async actions like fetching data
    },
  },
  ```

### `after`

- **Usage**: Schedule actions to occur after a specified timeout.
- **Example**:

  ```typescript
  failure: {
    onEntry: ({ after, context }) => {
      if (context.attempts < 3) {
        after(1000, () => {
          return 'retry';
        });
      }
    },
  },
  ```

### State Transitions

Transitions are defined by specifying an event and a target state:

```typescript
idle: {
  on: {
    START_PROCESS: ({ context }) => {
      if (context.attempts < 5) {
        return 'processing';
      } else {
        console.log('Too many attempts, staying idle.');
        return 'idle';
      }
    },
  },
},
```

This snippet specifies that when the `START_PROCESS` event is received in the `idle` state, the machine should transition to `processing` if the number of attempts is less than 5, otherwise, it remains in `idle`.

## Best Practices

1. **Use Context Wisely**: Use the `context` to manage data that is shared across multiple states. For instance, storing fetched data, user input, or retry attempts.
2. **Error Handling States**: Use dedicated error states, like `failure`, to manage failures gracefully and handle retries.
3. **Asynchronous Actions**: When working with API requests or long-running operations, leverage the `onEntry` method to manage async workflows.
4. **State Hierarchies**: Use nested states for better organization and management of different phases in a workflow, especially in complex systems.
5. **Start Simple**: Start with simpler configurations before adding nested or parallel states. This makes debugging easier and ensures a better understanding of each state's role in the workflow.
6. **Parallel State Independence**: Keep parallel states independent when possible to prevent unexpected dependencies that could complicate transitions.

## Conclusion

The `machineFactory` API is a powerful and flexible tool for defining and managing complex state-driven workflows in JavaScript/TypeScript. Whether you're managing simple operations or handling more sophisticated parallel processes, `machineFactory` provides the flexibility to model your state transitions clearly and effectively.

For users familiar with xState, `machineFactory` offers a lightweight and highly customizable alternative with less overhead. This makes it a great option for projects that require state machines without the complexity that xState sometimes brings.

If you have further questions or need more detailed examples, feel free to explore the additional resources and example files provided in the repository.
